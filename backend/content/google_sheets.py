"""
Google Apps Script integration for FAS contact and prayer requests.

Django/Postgres remains the source of truth. Google Sheets is a secondary
delivery channel. The React frontend never talks to Google directly.
"""

import json
import logging
import os
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

logger = logging.getLogger(__name__)


def is_configured():
    return bool(
        os.getenv("FAS_GOOGLE_APPS_SCRIPT_URL")
        and os.getenv("FAS_GOOGLE_APPS_SCRIPT_TOKEN")
    )


def sync_contact_message(contact_message):
    """Send a ContactMessage to the FAS Google Apps Script web app.

    The Apps Script owns the Sheet and appends the row. Django/Postgres is
    always written first, so a Sheets outage cannot lose the request.
    """
    if not is_configured():
        return False

    payload = {
        "token": os.environ["FAS_GOOGLE_APPS_SCRIPT_TOKEN"],
        "submitted_at": (
            contact_message.created_at.isoformat()
            if contact_message.created_at
            else ""
        ),
        "name": contact_message.name,
        "email": contact_message.email,
        "phone": contact_message.phone or "",
        "request_type": contact_message.get_request_type_display(),
        "message": contact_message.message,
        "status": contact_message.get_status_display(),
    }

    body = json.dumps(payload).encode("utf-8")
    request = Request(
        os.environ["FAS_GOOGLE_APPS_SCRIPT_URL"],
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urlopen(request, timeout=20) as response:
            response_body = response.read().decode("utf-8")
            if response.status < 200 or response.status >= 300:
                raise RuntimeError(
                    f"Google Apps Script returned HTTP {response.status}"
                )

            try:
                result = json.loads(response_body)
            except json.JSONDecodeError:
                result = {}

            if result.get("ok") is not True:
                raise RuntimeError(
                    result.get("error", "Google Apps Script sync failed")
                )

        return True

    except (HTTPError, URLError, TimeoutError) as exc:
        raise RuntimeError(
            f"Google Apps Script request failed: {exc}"
        ) from exc
