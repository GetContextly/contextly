import os
import re
import sys
from pathlib import Path

class SecurityAuditor:
    def __init__(self, root_dir):
        self.root_dir = Path(root_dir)
        self.findings = []

    def audit_env_files(self):
        """Check for sensitive keys in version control or example files."""
        print("🔍 Auditing environment variables and secrets...")
        env_files = list(self.root_dir.glob("**/.env*"))
        for f in env_files:
            if "example" in f.name:
                with open(f, 'r') as file:
                    content = file.read()
                    if re.search(r'=[a-zA-Z0-9]{20,}', content):
                        self.findings.append(f"[HIGH] Potential real secret found in example file: {f}")

            # Check if .env is in .gitignore
            gitignore = self.root_dir / ".gitignore"
            if gitignore.exists():
                with open(gitignore, 'r') as file:
                    if ".env" not in file.read():
                        self.findings.append("[CRITICAL] .env files are NOT ignored in .gitignore")

    def audit_supabase_rls(self):
        """Scan SQL migrations for missing RLS or permissive policies."""
        print("🔍 Auditing Supabase RLS policies...")
        migrations = list(self.root_dir.glob("supabase/migrations/*.sql"))
        for m in migrations:
            with open(m, 'r') as file:
                content = file.read().lower()
                tables = re.findall(r'create table (?:if not exists )?public\.(\w+)', content)
                for table in tables:
                    if f"enable row level security" not in content:
                         self.findings.append(f"[MEDIUM] Table 'public.{table}' might be missing ENABLE ROW LEVEL SECURITY in {m.name}")

    def audit_api_endpoints(self):
        """Check for unprotected API routes in Next.js."""
        print("🔍 Auditing Next.js API route protection...")
        api_routes = list(self.root_dir.glob("packages/dashboard/src/app/api/**/*.ts"))
        for route in api_routes:
            with open(route, 'r') as file:
                content = file.read()
                if "supabase.auth.getUser()" not in content and "stripe.webhooks.constructEvent" not in content:
                    self.findings.append(f"[LOW] API route {route.relative_to(self.root_dir)} might lack auth validation")

    def run(self):
        self.audit_env_files()
        self.audit_supabase_rls()
        self.audit_api_endpoints()

        print("\n" + "="*50)
        print("🛡️  SECURITY AUDIT REPORT")
        print("="*50)
        if not self.findings:
            print("✅ No major vulnerabilities found.")
        else:
            for f in self.findings:
                print(f)
        print("="*50)

if __name__ == "__main__":
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    auditor = SecurityAuditor(root)
    auditor.run()
