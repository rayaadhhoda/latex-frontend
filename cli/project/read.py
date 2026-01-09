from pathlib import Path


def read_file(path: Path) -> str:
    return path.read_text(encoding='utf-8')


def list_files(folder_path: Path, recursive: bool = True) -> list[str]:
    """List all files in the directory, optionally recursively."""
    files = []
    if recursive:
        for file_path in folder_path.rglob('*'):
            if file_path.is_file():
                # Return relative path from folder_path
                files.append(str(file_path.relative_to(folder_path)))
    else:
        for file_path in folder_path.iterdir():
            if file_path.is_file():
                files.append(file_path.name)
    return sorted(files)
