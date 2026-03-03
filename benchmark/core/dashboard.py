from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
import argparse
import sys

import streamlit as st
from streamlit.runtime.scriptrunner import get_script_run_ctx
from streamlit.web import cli as stcli

from core.utils import BenchmarkMetadata, read_json


@dataclass
class DashboardRow:
    job_id: str
    summary: str
    status: str
    chat_started: str
    chat_ended: str
    chat_result: object | None
    error: str
    chat_duration_seconds: float | None


@dataclass
class DashboardSummary:
    base_dir: Path
    total_jobs: int
    completed_jobs: int
    failed_jobs: int
    pending_jobs: int
    rows: list[DashboardRow]


def load_dashboard(base_dir: Path) -> DashboardSummary:
    data_dir = base_dir / "data"
    rows: list[DashboardRow] = []

    if not data_dir.exists():
        return DashboardSummary(
            base_dir=base_dir,
            total_jobs=0,
            completed_jobs=0,
            failed_jobs=0,
            pending_jobs=0,
            rows=[],
        )

    for job_dir in sorted([p for p in data_dir.iterdir() if p.is_dir()]):
        metadata_file = job_dir / "metadata.json"
        if not metadata_file.exists():
            continue

        raw_metadata = read_json(metadata_file)
        metadata = BenchmarkMetadata.from_dict(raw_metadata)
        rows.append(_build_row(job_dir.name, metadata))

    completed_jobs = sum(1 for row in rows if row.status == "completed")
    failed_jobs = sum(1 for row in rows if row.status == "failed")
    pending_jobs = len(rows) - completed_jobs - failed_jobs

    return DashboardSummary(
        base_dir=base_dir,
        total_jobs=len(rows),
        completed_jobs=completed_jobs,
        failed_jobs=failed_jobs,
        pending_jobs=pending_jobs,
        rows=rows,
    )


def render_dashboard(summary: DashboardSummary) -> None:
    st.set_page_config(page_title="Benchmark Dashboard", layout="wide")
    st.title("Benchmark Dashboard")
    st.caption(f"Directory: `{summary.base_dir}`")

    c1, c2, c3, c4 = st.columns(4)
    c1.metric("Total", summary.total_jobs)
    c2.metric("Completed", summary.completed_jobs)
    c3.metric("Failed", summary.failed_jobs)
    c4.metric("Pending", summary.pending_jobs)

    if not summary.rows:
        st.info("No metadata found in `data/*/metadata.json`.")
        return

    status_options = sorted({row.status for row in summary.rows})
    selected_statuses = st.multiselect(
        "Filter by status", options=status_options, default=status_options
    )
    show_errors_only = st.checkbox("Show only rows with errors", value=False)
    st.caption("Timestamps are shown in local time when timezone data is available.")

    filtered_rows: list[DashboardRow] = []
    table_rows: list[dict[str, object]] = []
    for row in summary.rows:
        if row.status not in selected_statuses:
            continue
        if show_errors_only and not row.error:
            continue
        filtered_rows.append(row)
        table_rows.append(
            {
                "job_id": row.job_id,
                "status": row.status,
                "summary": row.summary,
                "chat_started": _format_local_timestamp(row.chat_started),
                "chat_ended": _format_local_timestamp(row.chat_ended),
                "chat_duration_seconds": row.chat_duration_seconds,
                "error": row.error,
            }
        )

    st.dataframe(table_rows, width="stretch", hide_index=True)
    _render_chat_result_links(filtered_rows)


@st.dialog("Chat Result", width="large")
def _render_chat_result_modal(row: DashboardRow) -> None:
    st.caption(f"Job: `{row.job_id}`")
    if isinstance(row.chat_result, (dict, list)):
        st.json(row.chat_result, expanded=True)
        return
    st.code(str(row.chat_result), language="text")


def _render_chat_result_links(rows: list[DashboardRow]) -> None:
    rows_with_chat = [row for row in rows if row.chat_result is not None]
    if not rows_with_chat:
        return

    st.subheader("Chat Results")
    st.caption("Click a link-style button to open the chat result modal.")

    for row in rows_with_chat:
        left, right = st.columns([6, 1])
        left.write(f"`{row.job_id}` - {row.summary}")
        if right.button("View", key=f"chat-result-{row.job_id}", type="tertiary"):
            _render_chat_result_modal(row)


def _build_row(job_id: str, metadata: BenchmarkMetadata) -> DashboardRow:
    return DashboardRow(
        job_id=job_id,
        summary=metadata.summary or "",
        status=metadata.status or "pending",
        chat_started=metadata.time_chat_start or "",
        chat_ended=metadata.time_chat_end or "",
        chat_result=metadata.chat_result,
        error=metadata.error or "",
        chat_duration_seconds=_seconds_between(
            metadata.time_chat_start, metadata.time_chat_end
        ),
    )


def _seconds_between(start: str | None, end: str | None) -> float | None:
    if not start or not end:
        return None

    try:
        start_time = datetime.fromisoformat(start)
        end_time = datetime.fromisoformat(end)
    except ValueError:
        return None

    delta = end_time - start_time
    seconds = delta.total_seconds()
    if seconds < 0:
        return None
    return seconds


def _format_local_timestamp(value: str) -> str:
    if not value:
        return ""

    try:
        parsed = datetime.fromisoformat(value)
    except ValueError:
        return value

    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)

    return parsed.astimezone().strftime("%Y-%m-%d %H:%M:%S %Z")


def _parse_streamlit_script_args() -> dict[str, Path]:
    parser = argparse.ArgumentParser(add_help=False)
    parser.add_argument("--dir", default=".")
    args, _ = parser.parse_known_args(sys.argv[1:])
    return {"path": Path(args.dir).resolve()}


def run_dashboard_app() -> None:
    script_args = _parse_streamlit_script_args()
    base_dir = script_args["path"]
    summary = load_dashboard(base_dir)
    render_dashboard(summary)


def _is_running_with_streamlit() -> bool:
    return get_script_run_ctx() is not None


def main() -> None:
    script_path = Path(__file__).resolve()
    sys.argv = ["streamlit", "run", str(script_path), "--", *sys.argv[1:]]
    raise SystemExit(stcli.main())


if _is_running_with_streamlit():
    run_dashboard_app()
elif __name__ == "__main__":
    main()
