from cli.settings.common import get_config_dir
import click


def nuke_config() -> None:
    if not click.confirm("Are you sure you want to nuke the config? "
                         "This will require you to run `init` again."):
        click.echo("+ Aborting.")
        return

    click.echo("+ Nuking config...")

    config_dir = get_config_dir()
    if not config_dir.exists():
        click.echo("+ Config directory does not exist. Nothing to nuke.")
        return

    for file in config_dir.iterdir():
        click.echo(f"+ Removing file: {file.absolute()}")
        file.unlink()
    click.echo(f"+ Removing dir : {config_dir.absolute()}")
    config_dir.rmdir()
    click.echo(f"+ Reset all configuration. Run `init` to setup again.")
