import os
import re

COMPONENTS_DIR = "packages/dashboard/src/components"
DOPE_MARKERS = [
    "perspective", "rotate-x", "animate-terminal-scroll",
    "text-[clamp", "glass-dark", "signal-green", "font-mono"
]

def verify_dope():
    print("🚀 Verifying 'Dope' Status of Landing Page...")
    files = [f for f in os.listdir(COMPONENTS_DIR) if f.endswith(".tsx")]

    total_markers = 0
    for file in files:
        path = os.path.join(COMPONENTS_DIR, file)
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()
            found = [m for m in DOPE_MARKERS if m in content]
            if found:
                print(f"  ✅ {file}: Technical markers found ({len(found)})")
                total_markers += len(found)
            else:
                print(f"  ⚠️ {file}: No elite markers detected.")

    if total_markers > 15:
        print("\n✨ LANDING PAGE STATUS: DOPE AS FUCK")
    else:
        print("\n📉 LANDING PAGE STATUS: POTENTIALLY GENERIC")

if __name__ == "__main__":
    verify_dope()
