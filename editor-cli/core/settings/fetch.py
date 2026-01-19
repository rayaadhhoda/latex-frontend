from core.settings.common import get_config_dir
import tomlkit


def fetch_all() -> dict:
    config_dir = get_config_dir()
    config_file = config_dir / "config.toml"
    if not config_file.exists():
        return {}
    # click.echo(f"+ Loading config from file: {config_file.absolute()}")
    fp = open(config_file, encoding="utf-8")
    config = tomlkit.load(fp)
    fp.close()
    return config


def fetch_one(key: str) -> str:
    config = fetch_all()
    return config.get(key, None)
