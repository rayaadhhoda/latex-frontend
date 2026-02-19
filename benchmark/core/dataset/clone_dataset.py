import shutil
import importlib.resources
from pathlib import Path
import click


def clone_dataset(context: dict) -> None:
    dataset_list = context["dataset"]

    with click.progressbar(dataset_list,
                           length=len(dataset_list),
                           update_min_steps=1,
                           label='+ Cloning dataset...') as bar:
        for dataset in bar:
            source = Path(
                importlib.resources.files("core")).parent / "data" / dataset
            destination = context["dir"] / "data" / dataset
            destination.mkdir(parents=True, exist_ok=True)
            shutil.copytree(source, destination, dirs_exist_ok=True)

    click.echo(f"+ Cloned {len(dataset_list)} items")
