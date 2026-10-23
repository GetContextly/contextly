"""Contextly Agent SDK — persist decisions across AI agent sessions."""

import json
import os
import subprocess
import sys
import threading
from typing import Any, Callable, Dict, List, Optional

from .errors import ContextlyError, ERROR_MESSAGES


def _parse_token(token: str) -> str:
    if not token.startswith("ctx_"):
        raise ValueError(
            "Token must start with 'ctx_'. "
            "Example: ctx_project.abc_K4xq7T2mN9pV1cF8jL3wR5bY6aH0gDe"
        )
    without_prefix = token[4:]
    underscore_idx = without_prefix.rfind("_")
    if underscore_idx == -1:
        raise ValueError(
            "Invalid token format. Expected: ctx_{scope}_{random}."
        )
    scope = without_prefix[:underscore_idx]
    if not scope:
        raise ValueError("Token scope cannot be empty.")
    return scope


def _get_server_path() -> str:
    """Find the MCP server entry point."""
    # Check if we're in the monorepo
    here = os.path.dirname(os.path.abspath(__file__))
    for candidate in [
        os.path.join(here, "..", "..", "mcp-server", "dist", "index.js"),
        os.path.join(here, "..", "..", "..", "packages", "mcp-server", "dist", "index.js"),
    ]:
        candidate = os.path.normpath(candidate)
        if os.path.isfile(candidate):
            return candidate
    # Fall back to npx
    return ""


class Contextly:
    """Client for the Contextly memory layer.

    Usage:
        ctx = Contextly(token="ctx_project.abc_K4xq7T2mN9pV1cF8jL3wR5bY6aH0gDe")
        context = ctx.read(task="What stack?")
        ctx.commit(cid="stack.choice", message="Next.js + Supabase")
    """

    def __init__(
        self,
        token: str,
        db_path: Optional[str] = None,
        server_command: Optional[str] = None,
        server_cwd: Optional[str] = None,
    ):
        self._scope = _parse_token(token)
        self._token = token
        self._next_id = 1
        self._conflict_handlers: List[Callable[[Dict[str, Any]], None]] = []
        self._poll_timer: Optional[threading.Timer] = None

        server_path = server_command or _get_server_path()
        if server_path and server_path.endswith(".js"):
            cmd = ["node", server_path]
        elif server_path:
            cmd = [server_path]
        else:
            cmd = ["npx", "@contextly/mcp-server"]

        env = os.environ.copy()
        env["CONTEXTLY_TOKEN"] = token
        env["CONTEXTLY_DB_PATH"] = db_path or ":memory:"

        self._proc = subprocess.Popen(
            cmd,
            cwd=server_cwd,
            env=env,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )

        self._do_handshake()

    @property
    def scope(self) -> str:
        return self._scope

    def close(self) -> None:
        if self._poll_timer:
            self._poll_timer.cancel()
        if self._proc and self._proc.poll() is None:
            self._proc.terminate()
            self._proc.wait(timeout=5)

    def __enter__(self):
        return self

    def __exit__(self, *args):
        self.close()

    # ── Low-level MCP protocol ──────────────────────────────────────

    def _send(self, method: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        msg_id = self._next_id
        self._next_id += 1
        request = {
            "jsonrpc": "2.0",
            "id": msg_id,
            "method": method,
            "params": params or {},
        }
        line = json.dumps(request, separators=(",", ":"))
        if self._proc.stdin is None or self._proc.stdout is None:
            raise RuntimeError("Server process is not running")
        self._proc.stdin.write(line + "\n")
        self._proc.stdin.flush()

        response_line = self._proc.stdout.readline()
        if not response_line:
            raise RuntimeError("Server closed connection unexpectedly")
        response = json.loads(response_line)

        if "error" in response:
            err = response["error"]
            code = err.get("data", {}).get("code", "INTERNAL_ERROR") if isinstance(err.get("data"), dict) else "INTERNAL_ERROR"
            raise ContextlyError(code, err.get("message", ""))
        return response.get("result", {})

    def _send_notification(self, method: str, params: Optional[Dict[str, Any]] = None) -> None:
        notification = {
            "jsonrpc": "2.0",
            "method": method,
            "params": params or {},
        }
        line = json.dumps(notification, separators=(",", ":"))
        if self._proc.stdin is None:
            raise RuntimeError("Server process is not running")
        self._proc.stdin.write(line + "\n")
        self._proc.stdin.flush()

    def _do_handshake(self) -> None:
        result = self._send("initialize", {
            "protocolVersion": "2024-11-05",
            "capabilities": {},
            "clientInfo": {"name": "contextly-sdk-py", "version": "1.0.0"},
        })
        self._server_capabilities = result.get("capabilities", {})
        self._send_notification("notifications/initialized")

    def _call_tool(self, name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        result = self._send("tools/call", {"name": name, "arguments": arguments})
        content = result.get("content", [])
        text_parts = [c["text"] for c in content if c.get("type") == "text"]
        if not text_parts:
            return {}
        parsed = json.loads(text_parts[0])
        if result.get("isError") or "error" in parsed:
            err = parsed.get("error", parsed)
            code = err.get("code", "INTERNAL_ERROR")
            msg = err.get("message", str(err))
            raise ContextlyError(code, msg)
        return parsed

    # ── Public API ──────────────────────────────────────────────────

    def read(
        self,
        budget: Optional[int] = None,
        kind: Optional[str] = None,
        cid: Optional[str] = None,
        task: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Read compiled context for this scope."""
        args: Dict[str, Any] = {"scope": self._scope, "token": self._token}
        if budget is not None:
            args["budget"] = budget
        if kind is not None:
            args["kind"] = kind
        if cid is not None:
            args["cid"] = cid
        if task is not None:
            args["task"] = task
        return self._call_tool("read_context", args)

    def commit(
        self,
        cid: str,
        message: str,
        kind: str = "decision",
        supersedes: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Commit a decision/rule/observation to this scope."""
        args: Dict[str, Any] = {
            "scope": self._scope,
            "token": self._token,
            "cid": cid,
            "message": message,
            "kind": kind,
        }
        if supersedes is not None:
            args["supersedes"] = supersedes
        result = self._call_tool("commit", args)
        if result.get("conflict"):
            for handler in self._conflict_handlers:
                try:
                    handler(result["conflict"])
                except Exception:
                    pass
        return result

    def query(
        self,
        id: Optional[str] = None,
        cid: Optional[str] = None,
        kind: Optional[str] = None,
        status: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Query entries in this scope."""
        args: Dict[str, Any] = {"scope": self._scope, "token": self._token}
        if id is not None:
            args["id"] = id
        if cid is not None:
            args["cid"] = cid
        if kind is not None:
            args["kind"] = kind
        if status is not None:
            args["status"] = status
        return self._call_tool("query", args)

    def resolve(
        self,
        cid: str,
        message: str,
        kind: str,
        superseding_id: str,
    ) -> Dict[str, Any]:
        """Resolve a conflict by superseding an entry."""
        return self._call_tool("resolve", {
            "scope": self._scope,
            "token": self._token,
            "cid": cid,
            "message": message,
            "kind": kind,
            "supersedingId": superseding_id,
        })

    def fork(self, scope: str, parent_scope: str) -> Dict[str, Any]:
        """Create a child scope that inherits from a parent."""
        return self._call_tool("fork", {
            "scope": scope,
            "parentScope": parent_scope,
            "token": self._token,
        })

    def merge(self, source: str, target: str) -> Dict[str, Any]:
        """Merge entries from source scope into target."""
        return self._call_tool("merge", {
            "source": source,
            "target": target,
            "token": self._token,
        })

    def on_conflict(
        self,
        handler: Callable[[Dict[str, Any]], None],
        poll_ms: int = 0,
    ) -> Callable[[], None]:
        """Register a handler for conflict notifications.

        The handler is called immediately when commit() detects a conflict.
        If poll_ms > 0, also polls read() at that interval for new conflicts.
        Returns an unsubscribe function.
        """
        self._conflict_handlers.append(handler)

        if poll_ms > 0 and self._poll_timer is None:
            def poll_loop():
                try:
                    ctx = self.read()
                    for c in ctx.get("conflicts", []):
                        for h in self._conflict_handlers:
                            try:
                                h(c)
                            except Exception:
                                pass
                except Exception:
                    pass
                if self._conflict_handlers:
                    self._poll_timer = threading.Timer(poll_ms / 1000, poll_loop)
                    self._poll_timer.daemon = True
                    self._poll_timer.start()
            poll_loop()

        def unsubscribe():
            self._conflict_handlers = [
                h for h in self._conflict_handlers if h is not handler
            ]
            if not self._conflict_handlers and self._poll_timer:
                self._poll_timer.cancel()
                self._poll_timer = None

        return unsubscribe