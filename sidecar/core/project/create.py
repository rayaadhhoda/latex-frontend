from pathlib import Path
import importlib.resources
import json
from typing import Dict, Any
import sys


def load_manifest() -> Dict[str, Any]:
    try:
        manifest_path = importlib.resources.files(
            "core.project.templates") / "manifest.json"

        if not manifest_path.exists():
            raise FileNotFoundError("manifest.json not found")

        return json.loads(manifest_path.read_text(encoding='utf-8'))
    except (AttributeError, ModuleNotFoundError, TypeError) as e:
        if getattr(sys, 'frozen', False):
            base_path = Path(sys._MEIPASS)
            manifest_path = base_path / "core" / "project" / "templates" / "manifest.json"
        else:
            base_path = Path(__file__).parent
            manifest_path = base_path / "templates" / "manifest.json"

        if not manifest_path.exists():
            raise FileNotFoundError("manifest.json not found") from e

        return json.loads(manifest_path.read_text(encoding='utf-8'))


def _collect_template_files(template_root: Path) -> Dict[str, bytes]:
    """Map posix relative paths (from template root) to raw file bytes."""
    files: Dict[str, bytes] = {}
    for file_path in template_root.rglob("*"):
        if file_path.is_file():
            rel = file_path.relative_to(template_root)
            files[rel.as_posix()] = file_path.read_bytes()
    return files


def load_template(template: str) -> Dict[str, bytes]:
    try:
        template_ref = importlib.resources.files(
            "core.project.templates") / template

        template_path = Path(template_ref)

        if not template_path.exists():
            raise FileNotFoundError(f"Template '{template}' not found")

        return _collect_template_files(template_path)
    except (AttributeError, ModuleNotFoundError, TypeError) as e:
        # Fallback for frozen PyInstaller or development
        if getattr(sys, 'frozen', False):
            # PyInstaller extracts to sys._MEIPASS
            base_path = Path(sys._MEIPASS)
        else:
            # Development: relative to this file
            base_path = Path(__file__).parent
        template_path = base_path / "core" / "project" / "templates" / template if getattr(
            sys, 'frozen', False) else base_path / "templates" / template

        if not template_path.exists():
            raise FileNotFoundError(f"Template '{template}' not found") from e

        return _collect_template_files(template_path)


def create_project(path: Path, template: str) -> None:
    # click.echo(
    #     f"+ Creating a new LaTeX project using the {template} template...")

    template_files = load_template(template)

    path.mkdir(parents=True, exist_ok=True)
    for relative_path, content in template_files.items():
        target_path = path / relative_path
        target_path.parent.mkdir(parents=True, exist_ok=True)
        target_path.write_bytes(content)
        # click.echo(f"  + Created {filename}")

    # click.echo(f"+ Project initialized successfully!")
