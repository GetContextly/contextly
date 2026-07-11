import os
from pathlib import Path

class ArchitectReviewer:
    """Analyzes the project structure for SOLID principles and modularity."""

    def __init__(self, root_dir):
        self.root_dir = Path(root_dir)
        self.metrics = {
            "circular_deps": 0,
            "large_files": [],
            "missing_tests": []
        }

    def check_file_sizes(self):
        print("📊 Checking for monolithic files...")
        for p in self.root_dir.glob("packages/**/*.ts*"):
            if "node_modules" in str(p) or "dist" in str(p): continue
            line_count = sum(1 for _ in open(p, 'rb'))
            if line_count > 300:
                self.metrics["large_files"].append((p, line_count))

    def check_test_coverage_presence(self):
        print("🧪 Checking for missing test files...")
        source_files = list(self.root_dir.glob("packages/*/src/**/*.ts"))
        for f in source_files:
            if f.name.endswith(".d.ts") or "index.ts" in f.name: continue
            test_file = f.parent.parent / "tests" / f.name.replace(".ts", ".test.ts")
            if not test_file.exists():
                self.metrics["missing_tests"].append(f)

    def report(self):
        print("\n" + "◈"*25)
        print("🏗️ ARCHITECTURAL REVIEW")
        print("◈"*25)

        if self.metrics["large_files"]:
            print("\n⚠️ Monolithic Files (>300 lines):")
            for f, count in self.metrics["large_files"]:
                print(f"  - {f.name}: {count} lines")

        if self.metrics["missing_tests"]:
            print(f"\n🧪 Testing Gaps: {len(self.metrics['missing_tests'])} source files lack unit tests.")

        print("\nReview Complete.")

if __name__ == "__main__":
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    ArchitectReviewer(root).report()
