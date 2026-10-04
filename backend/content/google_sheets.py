"""
Google Sheets integration for FAS contact and prayer requests.

The integration is intentionally server-side. Google credentials are never sent
to the React frontend. The Django ContactMessage is always saved first; Sheets
sync is a secondary delivery channel.
"""

import base64
import json
import logging
import os
from functools import lru_cache

logger = logging.getLogger(__name__)

SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]
DEFAULT_WORKSHEET = "Contact Requests"
HEADERS = [
    "Submitted At",
    "Name",
    "Email",
    "Phone",
    "Request Type",
    "Message",
    "Status",
]


def is_configured():
    return bool(
        os.getenv("FAS_GOOGLE_SHEETS_SPREADSHEET_ID")
        and os.getenv("FAS_GOOGLE_SERVICE_ACCOUNT_JSON_BASE64")
    )


@lru_cache(maxsize=1)
def _get_client():
    import gspread
    from google.oauth2.service_account import Credentials

    encoded = os.environ["FAS_GOOGLE_SERVICE_ACCOUNT_JSON_BASE64"]
    credentials_info = json.loads(
        base64.b64decode(encoded).decode("utf-8")
    )
    credentials = Credentials.from_service_account_info(
        credentials_info,
        scopes=SCOPES,
    )
    return gspread.authorize(credentials)


def _get_worksheet(client):
    spreadsheet_id = os.environ["FAS_GOOGLE_SHEETS_SPREADSHEET_ID"]
    spreadsheet = client.open_by_key(spreadsheet_id)

    try:
        worksheet = spreadsheet.worksheet(DEFAULT_WORKSHEET)
    except Exception:
        worksheet = spreadsheet.add_worksheet(
            title=DEFAULT_WORKSHEET,
            rows=1000,
            cols=len(HEADERS),
        )

    first_row = worksheet.row_values(1)
    if first_row != HEADERS:
        worksheet.update("A1:G1", [HEADERS])

    return worksheet


def sync_contact_message(contact_message):
    """Append a ContactMessage to the FAS Google Sheet.

    Returns True when a row was written. Raises on configuration/API errors so
    callers can log the failure without losing the Django database record.
    """
    if not is_configured():
        return False

    client = _get_client()
    worksheet = _get_worksheet(client)

    submitted_at = contact_message.created_at.isoformat() if contact_message.created_at else ""

    worksheet.append_row(
        [
            submitted_at,
            contact_message.name,
            contact_message.email,
            contact_message.phone or "",
            contact_message.get_request_type_display(),
            contact_message.message,
            contact_message.get_status_display(),
        ],
        value_input_option="USER_ENTERED",
    )
    return True
