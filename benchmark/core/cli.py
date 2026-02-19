import asyncio
import os
from pathlib import Path
import click

from core.bench import run_benchmarks
from core.utils import locate_server
from core.dataset import clone_dataset, load_dataset


@click.group(invoke_without_command=True)
@click.option(
    "--dir",
    type=click.Path(exists=True,
                    file_okay=False,
                    dir_okay=True,
                    resolve_path=True),
    default=None,
    help=
    "Directory to use for benchmarks. Defaults to current working directory.",
)
@click.pass_context
def cli(ctx: click.Context, dir: str | None) -> None:
    if ctx.obj is None:
        ctx.obj = {}
    ctx.obj["dir"] = dir if dir is not None else os.getcwd()
    click.echo(f"+ Using directory: {ctx.obj['dir']}")
    if ctx.invoked_subcommand is None:
        click.echo("")
        click.echo(ctx.get_help(), err=True)


@cli.command()
@click.pass_context
def run(ctx: click.Context) -> None:
    """Run benchmarks."""
    context = {}
    context["dir"] = Path(ctx.obj.get("dir"))

    locate_server(context)
    load_dataset(context)
    clone_dataset(context)
    run_benchmarks(context)


def main() -> None:
    cli()


if __name__ == "__main__":
    main()
