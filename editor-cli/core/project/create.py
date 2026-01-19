from pathlib import Path
import importlib.resources
from typing import Dict


def load_template(template: str) -> Dict[str, str]:
    try:
        template_ref = importlib.resources.files(
            "core.project.templates") / template
        template_path = Path(template_ref)

        if not template_path.exists():
            raise FileNotFoundError(f"Template '{template}' not found")

        files = {}
        for file_path in template_path.iterdir():
            if file_path.is_file():
                files[file_path.name] = file_path.read_text(encoding='utf-8')

        return files
    except (AttributeError, ModuleNotFoundError) as e:
        # Fallback for development or if importlib.resources doesn't work as expected
        current_file = Path(__file__).parent
        template_path = current_file.parent / "templates" / template

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

    try:
        template_files = load_template(template)

        path.mkdir(parents=True, exist_ok=True)
        for filename, content in template_files.items():
            target_path = path / filename
            target_path.write_text(content, encoding='utf-8')
            # click.echo(f"  + Created {filename}")

        # click.echo(f"+ Project initialized successfully!")

    except FileNotFoundError as e:
        # click.echo(f"Error: {e}", err=True)
        raise click.Abort()
    except Exception as e:
        # click.echo(f"Error creating project: {e}", err=True)
        raise click.Abort()
