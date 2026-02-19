import asyncio
from datetime import datetime, timezone

import click
from pathlib import Path

from core.utils import read_json, do_chat, write_json

def run_benchmarks(context: dict) -> None:
    with click.progressbar(context["dataset"],
                           length=context["dataset_count"],
                           update_min_steps=1,
                           label='+ Running benchmarks...') as bar:
        for dir_name in bar:
            click.echo("") # new line
            data_dir = context["dir"] / "data" / dir_name
            asyncio.run(_do_benchmark(context, data_dir))


async def _do_benchmark(context: dict, data_dir: Path) -> None:
    metadata = read_json(data_dir / "metadata.json")
    summary = metadata.get("summary", "")
    click.echo(f"  + Test: {summary}")

    try:
        # do chat
        prompt = (data_dir / "prompt.txt").read_text()
        metadata["time_chat_start"] = _get_timestamp()
        chat_result = do_chat(context, str(data_dir), prompt)
        metadata["chat_result"] = chat_result
        metadata["time_chat_end"] = _get_timestamp()

         # do score
        metadata["time_score_start"] = _get_timestamp()
        # TODO: determine scoring mechanism
        metadata["time_score_end"] = _get_timestamp()
        metadata["status"] = "completed"
    except Exception as e:
        click.echo(f"    + Error: {e}")
        metadata["error"] = str(e)
        metadata["status"] = "failed"
    finally:
        write_json(data_dir / "metadata.json", metadata)

def _get_timestamp() -> str:
    return datetime.now(timezone.utc).isoformat()
