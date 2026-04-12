import shutil
import subprocess
from pathlib import Path

from langchain_core.tools import tool


def _resolved_under_root(root: Path, relative: str) -> Path:
    root_r = root.resolve()
    candidate = (root_r / relative).resolve()
    try:
        candidate.relative_to(root_r)
    except ValueError as e:
        raise ValueError(f"Path escapes project root: {relative!r}") from e
    return candidate


def create_local_tools(folder_path: Path, attached_image_path: str | None):
    """Create tools bound to a specific folder path."""

    @tool
    def read_file_tool(file_path: str) -> str:
        """Read the contents of a file in the project directory.

        Args:
            file_path: Relative path to the file from the project root (e.g., 'main.tex' or 'refs.bib')
        """
        full_path = folder_path / file_path
        if not full_path.exists():
            return f"Error: File '{file_path}' does not exist in the project directory."
        if not full_path.is_file():
            return f"Error: '{file_path}' is not a file."
        try:
            return full_path.read_text()
        except Exception as e:
            return f"Error reading file '{file_path}': {str(e)}"

    @tool
    def edit_file_tool(file_path: str, content: str) -> str:
        """Edit or create a file in the project directory.

        Args:
            file_path: Relative path to the file from the project root (e.g., 'main.tex' or 'refs.bib')
            content: The complete content to write to the file
        """
        full_path = folder_path / file_path
        try:
            full_path.parent.mkdir(parents=True, exist_ok=True)
            full_path.write_text(content)
            return f"Successfully updated '{file_path}'."
        except Exception as e:
            return f"Error writing to file '{file_path}': {str(e)}"

    @tool
    def delete_file_tool(file_path: str) -> str:
        """Delete a file from the project directory. Does not delete directories.

        Args:
            file_path: Relative path to the file from the project root
        """
        try:
            path = _resolved_under_root(folder_path, file_path)
            if not path.exists():
                return f"Error: File '{file_path}' does not exist in the project directory."
            if not path.is_file():
                return f"Error: '{file_path}' is not a file."
            path.unlink()
            return f"Successfully deleted '{file_path}'."
        except ValueError as e:
            return str(e)
        except Exception as e:
            return f"Error deleting file '{file_path}': {str(e)}"

    @tool
    def rename_file_tool(from_path: str, to_path: str) -> str:
        """Rename or move a file within the project directory.

        Args:
            from_path: Current relative path of the file from the project root
            to_path: New relative path for the file from the project root
        """
        try:
            src = _resolved_under_root(folder_path, from_path)
            dst = _resolved_under_root(folder_path, to_path)
            if not src.exists():
                return f"Error: File '{from_path}' does not exist in the project directory."
            if not src.is_file():
                return f"Error: '{from_path}' is not a file."
            if src == dst:
                return f"No change: '{from_path}' is already at that path."
            if dst.exists():
                return f"Error: Destination already exists: '{to_path}'."
            dst.parent.mkdir(parents=True, exist_ok=True)
            src.rename(dst)
            return f"Successfully renamed '{from_path}' to '{to_path}'."
        except ValueError as e:
            return str(e)
        except Exception as e:
            return f"Error renaming file: {str(e)}"

    @tool
    def list_files_tool(recursive: bool = True) -> str:
        """List all files in the project directory.

        Args:
            recursive: If True, list files recursively in subdirectories. If False, only list files in the root directory.
        """
        if recursive:
            files = [
                str(p.relative_to(folder_path)) for p in folder_path.rglob("*")
                if p.is_file()
            ]
        else:
            files = [
                str(p.relative_to(folder_path)) for p in folder_path.iterdir()
                if p.is_file()
            ]
        if not files:
            return "No files found in the project directory."
        file_list = "\n".join(f"  - {f}" for f in sorted(files))
        return f"Files in project directory:\n{file_list}"

    @tool
    def compile_latex_tool() -> str:
        """Compile the LaTeX project."""
        for compiler in ("tectonic", "pdflatex", "latexmk"):
            if shutil.which(compiler):
                break
        else:
            return "Error: No LaTeX compiler found (tried tectonic, pdflatex, latexmk)."

        if compiler == "tectonic":
            cmd = ["tectonic", "-X", "compile", "main.tex"]
        elif compiler == "latexmk":
            cmd = ["latexmk", "-pdf", "-interaction=nonstopmode", "main.tex"]
        else:
            cmd = ["pdflatex", "-interaction=nonstopmode", "main.tex"]

        try:
            result = subprocess.run(cmd,
                                    cwd=str(folder_path),
                                    capture_output=True,
                                    text=True,
                                    timeout=120)
            if result.returncode == 0:
                return "SUCCESS"
            return f"FAILED: {result.stderr}"
        except subprocess.TimeoutExpired:
            return "Error: Compilation timed out."
        except Exception as e:
            return f"Error compiling: {str(e)}"

    @tool
    def move_attached_image_to_project_tool() -> str:
        """Move the currently attached image into the project's figures directory."""
        if not attached_image_path:
            return "Error: No image is currently attached."
        try:
            image_path = Path(attached_image_path)
            figures_dir = folder_path / "figures"
            figures_dir.mkdir(parents=True, exist_ok=True)
            destination = figures_dir / image_path.name
            counter = 1
            stem, suffix = destination.stem, destination.suffix
            while destination.exists():
                destination = figures_dir / f"{stem}-{counter}{suffix}"
                counter += 1
            shutil.move(str(image_path), str(destination))
            return f"Moved attached image to '{destination.relative_to(folder_path)}'."
        except Exception as e:
            return f"Error moving attached image into project: {str(e)}"

    return [
        read_file_tool,
        edit_file_tool,
        delete_file_tool,
        rename_file_tool,
        list_files_tool,
        compile_latex_tool,
        move_attached_image_to_project_tool,
    ]
