from pathlib import Path


def edit_file(path: Path, content: str) -> None:
    path.write_text(content, encoding='utf-8')
