import click
from pathlib import Path
from core.utils import read_json


def run_benchmarks(context: dict) -> None:
    with click.progressbar(context["dataset"],
                           length=context["dataset_count"],
                           update_min_steps=1,
                           label='+ Running benchmarks...') as bar:
        for dir_name in bar:
            click.echo("")
            data_dir = context["dir"] / "data" / dir_name
            do_benchmark(context, data_dir)


def do_benchmark(context: dict, data_dir: Path) -> None:
    metadata = read_json(data_dir / "metadata.json")
    summary = metadata.get("summary", "")
    click.echo(f"  + Test: {summary}")
