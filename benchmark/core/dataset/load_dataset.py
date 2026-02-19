import importlib.resources
from pathlib import Path
import click


def load_dataset(context: dict, new_only: bool) -> None:
    click.echo("+ Loading dataset items...")

    dataset_list = []
    path = Path(importlib.resources.files("core")).parent / "data"
    for dataset in path.iterdir():
        if dataset.is_dir():
            dataset_list.append(dataset.name)
    context['dataset_count'] = len(dataset_list)
    click.echo(f"  + Found {context['dataset_count']} data directories")

    if new_only:
        to_remove = []
        for dataset in dataset_list:
            if (context["dir"] / "data" / dataset).exists():
                to_remove.append(dataset)
        for dataset in to_remove:
            dataset_list.remove(dataset)
        context['dataset_count'] = len(dataset_list)
        click.echo(f"  + Filtered to {context['dataset_count']} new data directories")
    context['dataset'] = dataset_list
