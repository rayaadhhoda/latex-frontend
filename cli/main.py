from pathlib import Path
import click
from cli import __version__
from cli.project.create import create_project


@click.group()
@click.version_option(version=__version__)
def cli():
    pass


@cli.command()
@click.option("--template",
              default="default",
              type=click.Choice(["default", "minimal"], case_sensitive=False),
              help="The template to use for the new project.")
@click.option("--dir",
              required=False,
              default=None,
              type=click.Path(dir_okay=True,
                              file_okay=False,
                              readable=True,
                              writable=True),
              help="The directory to create the new project in.")
def init(template: str, dir: str):
    """Initialize a new LaTeX project in the given directory."""
    dir = Path(dir) if dir else Path.cwd()
    create_project(dir, template)


@cli.command()
@click.argument("query", required=True)
def chat(query):
    """Chat with the LaTeX chatbot."""
    if not query:
        click.echo("Error: Missing required arguments: query", err=True)
        raise click.Abort()
    click.echo(f"Query: {query}")


if __name__ == "__main__":
    cli()
