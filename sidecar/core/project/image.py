import base64
import re
import shutil
import uuid
from pathlib import Path

from platformdirs import user_runtime_path


_UUID_PREFIX_PATTERN = re.compile(r"^[0-9a-f]{32}-(.+)$")


def _resolve_uploaded_image_path(uploaded_path: str) -> Path:
    """Validate uploaded image path and return resolved path."""
    if not uploaded_path:
        raise ValueError("Missing uploaded image path")

    runtime_dir = user_runtime_path(appname="latex-chatbot", ensure_exists=True).resolve()
    image_path = Path(uploaded_path).resolve()
    if runtime_dir != image_path.parent:
        raise ValueError("Invalid uploaded image path")
    if not image_path.exists() or not image_path.is_file():
        raise ValueError(f"Invalid image path: {uploaded_path}")
    return image_path


def _get_original_filename(filename: str) -> str:
    """Recover original filename from runtime-uploaded image filename."""
    match = _UUID_PREFIX_PATTERN.match(filename)
    return match.group(1) if match else filename


def store_uploaded_image(selected_path: str) -> tuple[str, str, str, str]:
    """Store a selected local image file in the app runtime temp dir."""
    source = Path(selected_path)
    if not source.exists() or not source.is_file():
        raise ValueError(f"Invalid image path: {selected_path}")

    temp_dir = user_runtime_path(appname="latex-chatbot", ensure_exists=True)
    original_filename = source.name
    file_path = temp_dir / f"{uuid.uuid4().hex}-{original_filename}"

    with source.open("rb") as source_file:
        image_bytes = source_file.read()

    with file_path.open("wb") as destination:
        destination.write(image_bytes)

    image_bytes_b64 = base64.b64encode(image_bytes).decode("ascii")
    return original_filename, file_path.name, str(file_path), image_bytes_b64


def get_uploaded_image_bytes_b64(uploaded_path: str) -> str:
    """Read and return uploaded image bytes as a base64 ASCII string."""
    image_path = _resolve_uploaded_image_path(uploaded_path)
    image_bytes = image_path.read_bytes()
    return base64.b64encode(image_bytes).decode("ascii")


def move_uploaded_image_to_project(
    uploaded_path: str, project_root: Path, target_dir: str = "figures"
) -> str:
    """Move uploaded image into project target directory and return relative path."""
    image_path = _resolve_uploaded_image_path(uploaded_path)
    project_root = project_root.resolve()
    destination_dir = (project_root / target_dir).resolve()
    destination_dir.mkdir(parents=True, exist_ok=True)

    original_name = _get_original_filename(image_path.name)
    stem = Path(original_name).stem
    suffix = Path(original_name).suffix
    destination = destination_dir / original_name
    counter = 1
    while destination.exists():
        destination = destination_dir / f"{stem}-{counter}{suffix}"
        counter += 1

    shutil.move(str(image_path), str(destination))
    return str(destination.relative_to(project_root))


def remove_uploaded_image(uploaded_path: str) -> str:
    """Remove a previously stored uploaded image from runtime temp dir."""
    image_path = _resolve_uploaded_image_path(uploaded_path)
    image_path.unlink()
    return str(image_path)
