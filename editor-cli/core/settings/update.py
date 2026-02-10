from core.settings.common import get_config_dir
import tomlkit


def update_config(updates: dict) -> dict:
    config_dir = get_config_dir()
    config_file = config_dir / "config.toml"

    # Load existing or create new
    if config_file.exists():
        config = tomlkit.loads(config_file.read_text(encoding="utf-8"))
    else:
        config_dir.mkdir(parents=True, exist_ok=True)
        config = tomlkit.table()

    # Update values
    for key, value in updates.items():
        config[key] = value

    config_file.write_text(config.as_string(), encoding="utf-8")
    return dict(config)
