from dataclasses import dataclass, asdict, field
from typing import Any


@dataclass
class BenchmarkMetadata:
    summary: str = ""
    time_chat_start: str | None = None
    time_chat_end: str | None = None
    time_score_start: str | None = None
    time_score_end: str | None = None
    status: str | None = None
    error: str | None = None
    chat_result: Any = None
    extra: dict[str, Any] = field(default_factory=dict)

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "BenchmarkMetadata":
        known_keys = {
            "summary",
            "time_chat_start",
            "time_chat_end",
            "time_score_start",
            "time_score_end",
            "status",
            "error",
            "chat_result",
        }
        extra = {k: v for k, v in data.items() if k not in known_keys}
        return cls(
            summary=data.get("summary", ""),
            time_chat_start=data.get("time_chat_start"),
            time_chat_end=data.get("time_chat_end"),
            time_score_start=data.get("time_score_start"),
            time_score_end=data.get("time_score_end"),
            status=data.get("status"),
            error=data.get("error"),
            chat_result=data.get("chat_result"),
            extra=extra,
        )

    def to_dict(self) -> dict[str, Any]:
        data = asdict(self)
        extra = data.pop("extra", {})
        data.update(extra)
        return data
from dataclasses import dataclass, asdict, field
from typing import Any, Dict, Optional


@dataclass
class BenchmarkMetadata:
    summary: str = ""
    time_chat_start: Optional[str] = None
    time_chat_end: Optional[str] = None
    time_score_start: Optional[str] = None
    time_score_end: Optional[str] = None
    status: Optional[str] = None
    error: Optional[str] = None
    chat_result: Any = None
    extra: Dict[str, Any] = field(default_factory=dict)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "BenchmarkMetadata":
        known_keys = {
            "summary",
            "time_chat_start",
            "time_chat_end",
            "time_score_start",
            "time_score_end",
            "status",
            "error",
            "chat_result",
        }
        extra = {k: v for k, v in data.items() if k not in known_keys}
        return cls(
            summary=data.get("summary", ""),
            time_chat_start=data.get("time_chat_start"),
            time_chat_end=data.get("time_chat_end"),
            time_score_start=data.get("time_score_start"),
            time_score_end=data.get("time_score_end"),
            status=data.get("status"),
            error=data.get("error"),
            chat_result=data.get("chat_result"),
            extra=extra,
        )

    def to_dict(self) -> Dict[str, Any]:
        data = asdict(self)
        extra = data.pop("extra", {})
        data.update(extra)
        return data

