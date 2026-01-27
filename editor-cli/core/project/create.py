from pathlib import Path
import importlib.resources
from typing import Dict
import sys
import json

# #region agent log
_DEBUG_LOG_PATH = "/Users/vivek/Documents/Code/latex-chatbot/.cursor/debug.log"
def _debug_log(hypothesis_id: str, location: str, message: str, data: dict):
    import time
    entry = {"hypothesisId": hypothesis_id, "location": location, "message": message, "data": data, "timestamp": int(time.time() * 1000), "sessionId": "debug-session"}
    with open(_DEBUG_LOG_PATH, "a") as f: f.write(json.dumps(entry) + "\n")
# #endregion


def load_template(template: str) -> Dict[str, str]:
    # #region agent log
    is_frozen = getattr(sys, 'frozen', False)
    meipass = getattr(sys, '_MEIPASS', None)
    _debug_log("H1", "create.py:load_template:entry", "Function entry", {"template": template, "is_frozen": is_frozen, "meipass": meipass})
    # #endregion

    try:
        template_ref = importlib.resources.files(
            "core.project.templates") / template
        
        # #region agent log
        _debug_log("H2", "create.py:load_template:importlib", "importlib.resources result", {"template_ref": str(template_ref), "template_ref_type": str(type(template_ref))})
        # #endregion
        
        template_path = Path(template_ref)

        # #region agent log
        _debug_log("H3", "create.py:load_template:path_conversion", "Path conversion result", {"template_path": str(template_path), "exists": template_path.exists() if template_path else False})
        # #endregion

        if not template_path.exists():
            raise FileNotFoundError(f"Template '{template}' not found")

        files = {}
        for file_path in template_path.iterdir():
            if file_path.is_file():
                files[file_path.name] = file_path.read_text(encoding='utf-8')

        # #region agent log
        _debug_log("H5", "create.py:load_template:success", "Template loaded successfully", {"files_found": list(files.keys())})
        # #endregion

        return files
    except (AttributeError, ModuleNotFoundError, TypeError) as e:
        # #region agent log
        _debug_log("H2H3", "create.py:load_template:exception", "Caught exception in importlib path", {"error": str(e), "error_type": type(e).__name__})
        # #endregion
        
        # Fallback for frozen PyInstaller or development
        if getattr(sys, 'frozen', False):
            # PyInstaller extracts to sys._MEIPASS
            base_path = Path(sys._MEIPASS)
        else:
            # Development: relative to this file
            base_path = Path(__file__).parent
        template_path = base_path / "core" / "project" / "templates" / template if getattr(sys, 'frozen', False) else base_path / "templates" / template

        # #region agent log
        _debug_log("H4", "create.py:load_template:fallback", "Fallback path resolution", {"__file__": __file__, "base_path": str(base_path), "template_path": str(template_path), "exists": template_path.exists()})
        # #endregion

        if not template_path.exists():
            raise FileNotFoundError(f"Template '{template}' not found") from e

        files = {}
        for file_path in template_path.iterdir():
            if file_path.is_file():
                files[file_path.name] = file_path.read_text(encoding='utf-8')

        return files


def create_project(path: Path, template: str) -> None:
    # click.echo(
    #     f"+ Creating a new LaTeX project using the {template} template...")

    template_files = load_template(template)

    path.mkdir(parents=True, exist_ok=True)
    for filename, content in template_files.items():
        target_path = path / filename
        target_path.write_text(content, encoding='utf-8')
        # click.echo(f"  + Created {filename}")

    # click.echo(f"+ Project initialized successfully!")
