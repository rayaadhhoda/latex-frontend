from pathlib import Path
import click
from core import __version__, compiler
from core import project
from core import settings
from core.chat import chatbot


@click.group()
@click.version_option(version=__version__)
@click.option("--dir",
              required=False,
              default=None,
              type=click.Path(dir_okay=True,
                              file_okay=False,
                              readable=True,
                              writable=True),
              help="The directory to use for the operation.")
@click.pass_context
def cli(ctx, dir):
    if settings.first_run.is_first_run():
        settings.first_run.setup_first_run()

    # Store dir in context so all commands can access it
    ctx.ensure_object(dict)
    ctx.obj['dir'] = Path(dir) if dir else Path.cwd()
    click.echo(f"+ Using directory: {ctx.obj['dir'].absolute()}")


@cli.command()
@click.option("--template",
              default="default",
              type=click.Choice(["default", "minimal"], case_sensitive=False),
              help="The template to use for the new project.")
@click.pass_context
def init(ctx, template: str):
    """Initialize a new LaTeX project in the given directory."""
    dir = ctx.obj['dir']
    project.create.create_project(dir, template)


# TODO: compile project
@cli.command()
@click.pass_context
def compile(ctx):
    """Compile the LaTeX project."""
    dir = ctx.obj['dir']
    compiler.compile_project(dir)


@cli.command()
@click.argument("query", required=True)
@click.pass_context
def chat(ctx, query):
    """Chat with the LaTeX chatbot."""
    dir = ctx.obj['dir']
    try:
        response = chatbot.chat_with_project(dir, query)
        click.echo(response)
    except Exception as e:
        click.echo(f"+ Error: {str(e)}", err=True)
        raise click.Abort()


@cli.command()
@click.argument("key", required=False)
def config(key: str):
    """Show the saved config."""
    if not key:
        config = settings.fetch_all()
        if not config:
            click.echo("+ No config found. Run `init` to setup.", err=True)
            raise click.Abort()
    else:
        config = settings.fetch_one(key)
        if not config:
            click.echo(f"+ No config found for {key}.", err=True)
            raise click.Abort()
    click.echo(f"+\n+   {config.as_string().replace('\n', '\n+   ').strip()}")


@cli.command()
def nuke():
    """Nuke the config."""
    settings.nuke.nuke_config()

if __name__ == "__main__":
    cli()
