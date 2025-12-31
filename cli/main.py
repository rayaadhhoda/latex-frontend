"""Main entry point for the LaTeX Chatbot CLI."""
from pathlib import Path
import click
from cli import __version__


@click.group()
@click.version_option(version=__version__)
def cli():
    """LaTeX Chatbot CLI - Interact with LaTeX chatbot services."""
    pass


@cli.command()
def init():
    """Initialize a new LaTeX project."""
    pwd = Path.cwd()
    click.echo(f"Initializing a new LaTeX project in {pwd}...")
    # TODO: Implement init functionality


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
