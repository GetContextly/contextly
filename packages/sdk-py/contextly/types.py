"""Type definitions for the Contextly SDK (used as documentation)."""

from typing import Any, Dict, List, Optional, TypedDict


class ReadOptions(TypedDict, total=False):
    budget: int
    kind: str
    cid: str
    task: str


class CommitInput(TypedDict, total=False):
    cid: str
    message: str
    kind: str
    supersedes: str


class QueryFilter(TypedDict, total=False):
    id: str
    cid: str
    kind: str
    status: str


class ResolveInput(TypedDict):
    cid: str
    message: str
    kind: str
    supersedingId: str


class MergeInput(TypedDict):
    source: str
    target: str


class ConflictInfo(TypedDict):
    cid: str
    existingMessage: str
    existingId: str
    incomingMessage: str
    incomingId: str