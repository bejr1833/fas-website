import logging
from datetime import timedelta

from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone

from .models import ContactMessage

logger = logging.getLogger(__name__)


def _send(prayer, subject, body):
    return send_mail(
        subject=subject,
        message=body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[prayer.email],
        fail_silently=False,
    )


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
