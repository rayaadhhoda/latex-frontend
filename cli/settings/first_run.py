from cli.settings.common import get_config_dir
import tomlkit
import click


def is_first_run() -> bool:
    return not get_config_dir().exists()


def setup_first_run() -> None:
    click.echo("+ Performing first-time setup...")
    config_dir = get_config_dir()
    click.echo(f"+ Creating config directory: {config_dir.absolute()}")
    config_dir.mkdir(parents=True, exist_ok=True)

    default_config = tomlkit.table()
    api_base = click.prompt("Please paste your OpenAI-compatible API URL",
                            hide_input=False,
                            default="https://api.openai.com/v1",
                            show_default=True,
                            type=click.STRING)
    default_config.add("openai_api_base", api_base)

    api_key = click.prompt("Please paste your OpenAI API key",
                           hide_input=True,
                           default="",
                           show_default=True,
                           type=click.STRING)
    default_config.add("openai_api_key", api_key)

    api_model = click.prompt("Please paste your OpenAI API model",
                             hide_input=False,
                             default="gpt-4o-mini",
                             show_default=True,
                             type=click.STRING)
    default_config.add("openai_api_model", api_model)

    config_file = config_dir / "config.toml"
    click.echo(f"+ Writing config to file: {config_file.absolute()}")
    config_file.write_text(default_config.as_string(), encoding="utf-8")

    click.echo(f"+ First-time setup complete!")
