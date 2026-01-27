#!/usr/bin/env python3
"""
Build script for latex-chatbot.

This script:
1. Builds the CLI wheel using uv
2. Creates a PyInstaller executable with target triple naming
3. Copies the sidecar to gui/src-tauri/bin/
4. Runs tauri build to generate the final app bundle
"""
print("Starting build script...")

import platform
import shutil
import subprocess
import sys
from pathlib import Path

# Paths
ROOT = Path(__file__).parent
CLI_DIR = ROOT / "editor-cli"
GUI_DIR = ROOT / "editor-gui"
SIDECAR_DIR = GUI_DIR / "src-tauri" / "bin"


def get_target_triple() -> str:
    """Return the Tauri target triple for the current platform."""
    system = platform.system().lower()
    machine = platform.machine().lower()

    if system == "darwin":
        if machine == "arm64":
            return "aarch64-apple-darwin"
        return "x86_64-apple-darwin"
    elif system == "windows":
        if machine == "amd64" or machine == "x86_64":
            return "x86_64-pc-windows-msvc"
        return "i686-pc-windows-msvc"
    elif system == "linux":
        if machine == "aarch64":
            return "aarch64-unknown-linux-gnu"
        return "x86_64-unknown-linux-gnu"
    else:
        raise RuntimeError(f"Unsupported platform: {system}/{machine}")


def get_sidecar_name(target_triple: str) -> str:
    """Return the sidecar filename with target triple."""
    base = f"latex-chatbot-cli-{target_triple}"
    if "windows" in target_triple:
        return f"{base}.exe"
    return base


def run(cmd: list[str],
        cwd: Path | None = None,
        check: bool = True) -> subprocess.CompletedProcess:
    """Run a command and print it."""
    print(f"+ {' '.join(cmd)}")
    return subprocess.run(cmd, cwd=cwd, check=check)


def build_wheel() -> Path:
    """Build the CLI wheel and return path to the .whl file."""
    print("\n=== Building CLI wheel ===")
    run(["uv", "build"], cwd=CLI_DIR)

    dist_dir = CLI_DIR / "dist"
    wheels = list(dist_dir.glob("*.whl"))
    if not wheels:
        raise FileNotFoundError(f"No .whl file found in {dist_dir}")

    wheel = wheels[0]
    print(f"+ Built wheel: {wheel}")
    return wheel


def build_pyinstaller(target_triple: str) -> Path:
    """Build PyInstaller executable and return path to the binary."""
    print("\n=== Building PyInstaller executable ===")

    sidecar_name = get_sidecar_name(target_triple)
    # Remove extension for PyInstaller --name (it adds .exe on Windows automatically)
    exe_name = sidecar_name.removesuffix(".exe")

    # PyInstaller output directories
    build_dir = CLI_DIR / "build"
    dist_dir = CLI_DIR / "pyinstaller_dist"

    # Clean previous PyInstaller output
    if build_dir.exists():
        shutil.rmtree(build_dir)
    if dist_dir.exists():
        shutil.rmtree(dist_dir)

    copy_metadata = [
        "genai_prices",
        "pydantic_ai_slim",
    ]

    # Build the command with hidden imports
    cmd = [
        "uv",
        "run",
        "pyinstaller",
        "--onefile",
        "--name",
        exe_name,
        "--distpath",
        str(dist_dir),
        "--workpath",
        str(build_dir),
        "--specpath",
        str(build_dir),
        # Include template files for project creation
        "--add-data",
        f"{CLI_DIR / 'core' / 'project' / 'templates'}:core/project/templates",
    ]
    for module in copy_metadata:
        cmd.extend(["--copy-metadata", module])
    cmd.append("cli/server.py")

    # Run PyInstaller via uv to use the dev dependency
    run(cmd, cwd=CLI_DIR)

    # Find the built executable
    exe_path = dist_dir / sidecar_name
    if not exe_path.exists():
        raise FileNotFoundError(f"PyInstaller output not found: {exe_path}")

    print(f"+ Built executable: {exe_path}")
    return exe_path


def copy_sidecar(exe_path: Path, target_triple: str) -> Path:
    """Copy the executable to the Tauri sidecar directory."""
    print("\n=== Copying sidecar to Tauri ===")

    SIDECAR_DIR.mkdir(parents=True, exist_ok=True)

    sidecar_name = get_sidecar_name(target_triple)
    dest = SIDECAR_DIR / sidecar_name

    shutil.copy2(exe_path, dest)
    print(f"+ Copied to: {dest}")
    return dest


def build_tauri():
    """Run tauri build to create the final app bundle."""
    print("\n=== Building Tauri app ===")
    run(["npm", "run", "tauri", "build"], cwd=GUI_DIR)


def main():
    print("=== latex-chatbot build script ===")

    target_triple = get_target_triple()
    print(f"+ Target triple: {target_triple}")

    # Step 1: Build wheel
    build_wheel()

    # Step 2: Build PyInstaller executable
    exe_path = build_pyinstaller(target_triple)

    # Step 3: Copy sidecar to Tauri
    copy_sidecar(exe_path, target_triple)

    # Step 4: Build Tauri app
    if "--link-only" not in sys.argv:
        build_tauri()

    print("\n=== Build complete ===")


if __name__ == "__main__":
    try:
        main()
    except subprocess.CalledProcessError as e:
        print(f"\n!!! Build failed: command exited with code {e.returncode}",
              file=sys.stderr)
        sys.exit(1)
    except FileNotFoundError as e:
        print(f"\n!!! Build failed: {e}", file=sys.stderr)
        sys.exit(1)
