"""In-memory guest rate limiting by IP."""

from collections import defaultdict
from datetime import date
from threading import Lock

from config import settings

_lock = Lock()
_counts: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))


def _client_key(ip: str) -> str:
    return ip or "unknown"


def check_and_increment(ip: str, is_member: bool) -> tuple[bool, int]:
    """Return (allowed, remaining_queries). Members are always allowed."""
    if is_member:
        return True, -1

    today = date.today().isoformat()
    key = _client_key(ip)

    with _lock:
        used = _counts[key][today]
        if used >= settings.guest_max_queries:
            return False, 0
        _counts[key][today] = used + 1
        return True, settings.guest_max_queries - used - 1


def get_remaining(ip: str, is_member: bool) -> int:
    if is_member:
        return -1
    today = date.today().isoformat()
    key = _client_key(ip)
    with _lock:
        used = _counts[key][today]
        return max(0, settings.guest_max_queries - used)
