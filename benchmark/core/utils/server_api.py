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


def do_chat(context: dict, dir: str, prompt: str) -> str:
    response = requests.post(
        f"{BASE_URL}/chat",
        json={
            "dir": dir,
            "prompt": prompt
        },
        timeout=120,
    )
    response.raise_for_status()
    data = response.json()
    if not data.get("success"):
        raise Exception(f"Chat failed: {data}")
    return data["data"]["response"]
