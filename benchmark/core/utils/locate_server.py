import requests
import click


def locate_server(context: dict) -> str:

    click.echo("+ Locating server...")

    response = requests.get("http://127.0.0.1:8765/health", timeout=2)
    if response.status_code == 200:
        context['status'] = response.json()['status']
        context['version'] = response.json()['version']
        click.echo(
            f"  + Status: {context['status']}, Version {context['version']}")
    else:
        context['status'] = 'error'
        context['version'] = 'unknown'
        raise Exception("Server not found: %s", response.text)
