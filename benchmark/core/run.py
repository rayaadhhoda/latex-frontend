import click

from core.utils import locate_server


@click.group()
def cli() -> None:
    """Benchmark runner."""
    pass


@cli.command()
def run() -> None:
    """Run benchmarks."""
    context = {}
    click.echo("+ Locating server...")
    locate_server(context)
    click.echo(f"  + Status: {context['status']}, Server Version {context['version']}")

    click.echo("+ Loading datasets...")
    load_dataset(context)
    click.echo(f"  + Found {context['dataset_count']} datasets")
    
    # with click.progressbar(context['dataset'], label='+ Running benchmarks...') as bar:
    #   for dataset_item in bar:
    #     click.echo(f"    + {dataset_item}")
    #     sleep(1)


def main() -> None:
    cli()


if __name__ == "__main__":
    main()
