from platformdirs import user_config_path
from pathlib import Path


def get_config_dir() -> Path:
    return user_config_path(appname="latex-chatbot", roaming=True)
