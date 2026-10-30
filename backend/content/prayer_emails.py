import html
import json
import logging
import threading
import urllib.error
import urllib.request
from datetime import timedelta

from django.conf import settings
from django.utils import timezone

from .models import ContactMessage

logger = logging.getLogger(__name__)

BREVO_SEND_URL = "https://api.brevo.com/v3/smtp/email"
FAS_EMAIL_LOGO_URL = "https://fas-fellowship.org/branding/fas-logo.png"


def _html_email(body):
    """Add the existing FAS logo above the unchanged plain-text email copy."""
    safe_body = html.escape(body).replace("\\n", "<br>")
    return (
        '<html><body style="margin:0;padding:24px;background:#f7f7f7;">'
        '<div style="max-width:600px;margin:0 auto;padding:28px;background:#ffffff;'
        'font-family:Arial,Helvetica,sans-serif;color:#222222;line-height:1.65;">'
        '<div style="text-align:center;margin:0 0 24px;">'
        f'<img src="{FAS_EMAIL_LOGO_URL}" alt="Faith Alone Saves — FAS" '
        'width="220" style="display:inline-block;width:220px;max-width:100%;height:auto;border:0;">'
        '</div>'
        f'<div style="font-size:15px;">{safe_body}</div>'
        '</div></body></html>'
    )


def _send(prayer, subject, body):
    """Send a transactional email through Brevo's HTTPS API (port 443)."""
    api_key = getattr(settings, "BREVO_API_KEY", "")
    if not api_key:
        raise RuntimeError("BREVO_API_KEY is not configured")

    payload = {
        "sender": {
            "name": settings.BREVO_SENDER_NAME,
            "email": settings.BREVO_SENDER_EMAIL,
        },
        "to": [{"email": prayer.email, "name": prayer.name}],
        "subject": subject,
        "textContent": body,
        "htmlContent": _html_email(body),
    }
    request = urllib.request.Request(
        BREVO_SEND_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "api-key": api_key,
            "accept": "application/json",
            "content-type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=8) as response:
            return 1 if 200 <= response.status < 300 else 0
    except urllib.error.HTTPError as exc:
        # Do not log request headers or the API key.
        logger.error("Brevo transactional email failed with HTTP status %s", exc.code)
        raise RuntimeError(f"Brevo returned HTTP {exc.code}") from None
    except urllib.error.URLError as exc:
        logger.error("Brevo transactional email connection failed: %s", exc.reason)
        raise


def send_prayer_acknowledgment(prayer):
    if prayer.acknowledgment_email_sent_at or not prayer.email_consent:
        return False
    body = (
        f"Dear {prayer.name},\n\n"
        "Greetings in Christ!\n\n"
        "Thank you for sharing your prayer request with Faith Alone Saves (FAS). "
        "We have received your prayer request, and we will be praying for you. "
        "You are not alone; may the Lord strengthen you, guide you, and fill your "
        "heart with His peace.\n\n"
        '"Do not be anxious about anything, but in every situation, by prayer and '
        'petition, with thanksgiving, present your requests to God." — Philippians 4:6\n\n'
        "With love and prayers,\nTeam FAS\nFAITH ALONE SAVES\n"
        "LOVE IN FELLOWSHIP & TRUTH"
    )
    try:
        if _send(prayer, "We've received your prayer request | FAS", body) == 1:
            ContactMessage.objects.filter(
                pk=prayer.pk, acknowledgment_email_sent_at__isnull=True
            ).update(acknowledgment_email_sent_at=timezone.now())
            return True
    except Exception:
        logger.exception("Prayer acknowledgment email failed for request #%s", prayer.pk)
    return False


def dispatch_prayer_acknowledgment_async(prayer_id):
    """Attempt the acknowledgment outside the HTTP request; scheduled retry is the fallback."""
    def deliver():
        try:
            prayer = ContactMessage.objects.get(pk=prayer_id)
            send_prayer_acknowledgment(prayer)
        except ContactMessage.DoesNotExist:
            return
        except Exception:
            logger.exception("Background prayer acknowledgment failed for request #%s", prayer_id)

    threading.Thread(
        target=deliver,
        name=f"fas-prayer-ack-{prayer_id}",
        daemon=True,
    ).start()


def send_prayer_followup(prayer):
    if prayer.followup_email_sent_at or not prayer.email_consent:
        return False
    body = (
        f"Dear {prayer.name},\n\n"
        "We hope you are doing well. This is a gentle note from Faith Alone Saves "
        "to remind you that you are not alone and that our fellowship continues "
        "to keep you in prayer. May God's peace guard your heart and mind today.\n\n"
        "If you would like to share an update or need further prayer, you are "
        "welcome to reach out to us.\n\n"
        "With love and prayers,\nTeam FAS\nFAITH ALONE SAVES\n"
        "LOVE IN FELLOWSHIP & TRUTH"
    )
    try:
        if _send(prayer, "A prayerful check-in from Team FAS", body) == 1:
            ContactMessage.objects.filter(
                pk=prayer.pk, followup_email_sent_at__isnull=True
            ).update(followup_email_sent_at=timezone.now())
            return True
    except Exception:
        logger.exception("Prayer follow-up email failed for request #%s", prayer.pk)
    return False


def process_pending_prayer_emails():
    now = timezone.now()
    base = ContactMessage.objects.filter(
        request_type="prayer", email_consent=True
    ).order_by("created_at")
    ack_sent = ack_failed = followup_sent = followup_failed = 0

    # Retry acknowledgments that could not be delivered at submission time.
    for prayer in base.filter(acknowledgment_email_sent_at__isnull=True)[:100]:
        if send_prayer_acknowledgment(prayer):
            ack_sent += 1
        else:
            ack_failed += 1

    due = base.filter(
        acknowledgment_email_sent_at__isnull=False,
        followup_email_sent_at__isnull=True,
        created_at__lte=now - timedelta(hours=24),
    )[:100]
    for prayer in due:
        if send_prayer_followup(prayer):
            followup_sent += 1
        else:
            followup_failed += 1

    return {
        "acknowledgments_retried": ack_sent,
        "acknowledgment_failures": ack_failed,
        "followups_sent": followup_sent,
        "followup_failures": followup_failed,
    }
