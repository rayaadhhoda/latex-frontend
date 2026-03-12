import requests
import click
import os

BASE_URL = "http://127.0.0.1:8767"


def locate_server(context: dict) -> str:

    click.echo("+ Locating server...")

    response = requests.get(f"{BASE_URL}/health", timeout=2)
    response.raise_for_status()
    data = response.json()
    context['status'] = data['status']
    context['version'] = data['version']
    click.echo(
        f"  + Status: {context['status']}, Version {context['version']}")


def load_creds(context: dict) -> None:
    context['openai_api_key'] = os.getenv("OPENAI_API_KEY")
    context['openai_api_base'] = os.getenv("OPENAI_API_BASE")
    context['openai_api_model'] = os.getenv("OPENAI_API_MODEL")


def do_chat(context: dict, dir: str, prompt: str) -> dict:
    response = requests.post(
        f"{BASE_URL}/chat",
        json={
            "dir": dir,
            "prompt": prompt,
            "openai_api_key": context['openai_api_key'],
            "openai_api_base": context['openai_api_base'],
            "openai_api_model": context['openai_api_model'],
        },
        timeout=300,
    )
    response.raise_for_status()
    res_json = response.json()
    if not res_json.get("success"):
        raise Exception(f"Chat failed: {res_json}")
    return res_json["data"]
