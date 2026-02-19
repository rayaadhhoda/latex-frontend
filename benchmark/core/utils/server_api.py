import requests
import click

BASE_URL = "http://127.0.0.1:8765"


def locate_server(context: dict) -> str:

    click.echo("+ Locating server...")

    response = requests.get(f"{BASE_URL}/health", timeout=2)
    response.raise_for_status()
    data = response.json()
    context['status'] = data['status']
    context['version'] = data['version']
    click.echo(
        f"  + Status: {context['status']}, Version {context['version']}")


def do_chat(context: dict, dir: str, prompt: str) -> dict:
    response = requests.post(
        f"{BASE_URL}/chat",
        json={
            "dir": dir,
            "prompt": prompt
        },
        timeout=300,
    )
    response.raise_for_status()
    res_json = response.json()
    if not res_json.get("success"):
        raise Exception(f"Chat failed: {res_json}")
    return res_json["data"]
