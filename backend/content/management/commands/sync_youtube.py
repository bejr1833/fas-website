import json
import os
from urllib.error import HTTPError, URLError
from urllib.parse import parse_qs, urlencode, urlparse
from urllib.request import Request, urlopen

from django.core.management.base import BaseCommand, CommandError
from django.utils.dateparse import parse_datetime
from django.utils import timezone

from content.models import FASVideo


API_BASE = "https://www.googleapis.com/youtube/v3"


def api_get(resource, params, api_key):
    query = dict(params)
    query["key"] = api_key

    url = f"{API_BASE}/{resource}?{urlencode(query)}"

    request = Request(
        url,
        headers={
            "User-Agent": "FAS-Website-YouTube-Sync/1.0",
        },
    )

    try:
        with urlopen(request, timeout=20) as response:
            return json.loads(response.read().decode("utf-8"))

    except HTTPError as exc:
        try:
            payload = json.loads(exc.read().decode("utf-8"))
            message = payload.get("error", {}).get("message", str(exc))
        except Exception:
            message = str(exc)

        raise CommandError(
            f"YouTube API error: {message}"
        ) from exc

    except URLError as exc:
        raise CommandError(
            f"Could not connect to YouTube API: {exc.reason}"
        ) from exc


def extract_youtube_video_id(video_url):
    if not video_url:
        return None

    try:
        parsed = urlparse(video_url)
        host = parsed.netloc.lower().replace("www.", "")
        parts = [part for part in parsed.path.split("/") if part]

        if host == "youtu.be" and parts:
            return parts[0]

        if host in {"youtube.com", "m.youtube.com"}:

            if parts and parts[0] == "watch":
                return parse_qs(
                    parsed.query
                ).get("v", [None])[0]

            if (
                parts
                and parts[0] in {"live", "shorts", "embed"}
                and len(parts) >= 2
            ):
                return parts[1]

    except Exception:
        return None

    return None


def canonical_youtube_url(video_id):
    return f"https://www.youtube.com/watch?v={video_id}"


class Command(BaseCommand):
    help = (
        "Sync public videos from the configured FAS YouTube channel. "
        "Only new uploads after YOUTUBE_SYNC_AFTER are created."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--limit",
            type=int,
            default=int(
                os.getenv(
                    "YOUTUBE_SYNC_LIMIT",
                    "20",
                )
            ),
            help=(
                "Maximum number of latest YouTube uploads "
                "to inspect."
            ),
        )

    def handle(self, *args, **options):
        api_key = os.getenv(
            "YOUTUBE_API_KEY",
            "",
        ).strip()

        handle = os.getenv(
            "YOUTUBE_CHANNEL_HANDLE",
            "@fas.fellowship",
        ).strip()

        default_category = os.getenv(
            "YOUTUBE_DEFAULT_CATEGORY",
            "fas-updates",
        ).strip()

        default_speaker = os.getenv(
            "YOUTUBE_DEFAULT_SPEAKER",
            "FAS Fellowship",
        ).strip()

        sync_after_raw = os.getenv(
            "YOUTUBE_SYNC_AFTER",
            "",
        ).strip()

        limit = max(
            1,
            min(
                int(options["limit"]),
                50,
            ),
        )

        if not api_key:
            raise CommandError(
                "YOUTUBE_API_KEY is not configured in backend/.env"
            )

        sync_after = None

        if sync_after_raw:
            sync_after = parse_datetime(
                sync_after_raw
            )

            if sync_after is None:
                raise CommandError(
                    "Invalid YOUTUBE_SYNC_AFTER value. "
                    "Use ISO format such as "
                    "2026-10-02T00:00:00Z"
                )

            if timezone.is_naive(sync_after):
                sync_after = timezone.make_aware(
                    sync_after
                )

        valid_categories = {
            value
            for value, _label in FASVideo.CATEGORY_CHOICES
        }

        if default_category not in valid_categories:
            default_category = "fas-updates"

        self.stdout.write(
            self.style.NOTICE(
                f"Syncing YouTube channel: {handle}"
            )
        )

        if sync_after:
            self.stdout.write(
                f"New upload cutoff: "
                f"{sync_after.isoformat()}"
            )

        channel_response = api_get(
            "channels",
            {
                "part": "snippet,contentDetails",
                "forHandle": handle,
            },
            api_key,
        )

        channel_items = channel_response.get(
            "items",
            [],
        )

        if not channel_items:
            raise CommandError(
                f"No YouTube channel found for handle: {handle}"
            )

        channel = channel_items[0]
        channel_id = channel["id"]

        channel_title = (
            channel.get("snippet", {}).get("title")
            or default_speaker
        )

        uploads_playlist_id = (
            channel.get("contentDetails", {})
            .get("relatedPlaylists", {})
            .get("uploads")
        )

        if not uploads_playlist_id:
            raise CommandError(
                "Could not find uploads playlist "
                f"for channel {channel_id}"
            )

        playlist_response = api_get(
            "playlistItems",
            {
                "part": "snippet,contentDetails",
                "playlistId": uploads_playlist_id,
                "maxResults": limit,
            },
            api_key,
        )

        playlist_items = playlist_response.get(
            "items",
            [],
        )

        if not playlist_items:
            self.stdout.write(
                self.style.WARNING(
                    "No uploads were returned from the channel."
                )
            )
            return

        video_ids = []

        for item in playlist_items:
            video_id = (
                item.get("contentDetails", {}).get("videoId")
                or item.get("snippet", {})
                .get("resourceId", {})
                .get("videoId")
            )

            if video_id:
                video_ids.append(video_id)

        video_ids = list(
            dict.fromkeys(video_ids)
        )

        status_by_id = {}

        for start in range(
            0,
            len(video_ids),
            50,
        ):
            batch = video_ids[
                start:start + 50
            ]

            status_response = api_get(
                "videos",
                {
                    "part": "snippet,status",
                    "id": ",".join(batch),
                },
                api_key,
            )

            for item in status_response.get(
                "items",
                [],
            ):
                status_by_id[item["id"]] = item

        existing_by_id = {}

        for existing in FASVideo.objects.all():
            video_id = extract_youtube_video_id(
                existing.video_url
            )

            if video_id:
                existing_by_id[video_id] = existing

        created_count = 0
        updated_count = 0
        skipped_count = 0

        for playlist_item in playlist_items:
            snippet = playlist_item.get(
                "snippet",
                {}
            )

            content_details = playlist_item.get(
                "contentDetails",
                {}
            )

            video_id = (
                content_details.get("videoId")
                or snippet.get(
                    "resourceId",
                    {},
                ).get("videoId")
            )

            if not video_id:
                continue

            video_data = status_by_id.get(
                video_id
            )

            if not video_data:
                skipped_count += 1
                continue

            status = video_data.get(
                "status",
                {}
            )

            privacy_status = status.get(
                "privacyStatus"
            )

            if privacy_status != "public":
                skipped_count += 1
                continue

            youtube_snippet = video_data.get(
                "snippet",
                snippet,
            )

            title = (
                youtube_snippet.get("title")
                or f"FAS YouTube Video {video_id}"
            )

            description = youtube_snippet.get(
                "description",
                "",
            )

            published_at = parse_datetime(
                youtube_snippet.get(
                    "publishedAt",
                    "",
                )
            )

            if published_at and timezone.is_naive(
                published_at
            ):
                published_at = timezone.make_aware(
                    published_at
                )

            video_url = canonical_youtube_url(
                video_id
            )

            existing = existing_by_id.get(
                video_id
            )

            # -------------------------------------------------
            # EXISTING VIDEOS
            # -------------------------------------------------
            #
            # Existing records can still be updated even when
            # they were published before the sync cutoff.
            #
            if existing:
                existing.title = title
                existing.description = description
                existing.video_url = video_url
                existing.published_at = published_at
                existing.is_published = True

                existing.save(
                    update_fields=[
                        "title",
                        "description",
                        "video_url",
                        "published_at",
                        "is_published",
                        "updated_at",
                    ]
                )

                updated_count += 1

                self.stdout.write(
                    f"UPDATED: {title}"
                )

                continue

            # -------------------------------------------------
            # NEW VIDEOS
            # -------------------------------------------------
            #
            # Only create videos published after the configured
            # cutoff.
            #
            if sync_after and (
                not published_at
                or published_at <= sync_after
            ):
                skipped_count += 1

                self.stdout.write(
                    f"SKIPPED OLD: {title}"
                )

                continue

            FASVideo.objects.create(
                title=title,
                speaker=channel_title
                or default_speaker,
                category=default_category,
                description=description,
                video_url=video_url,
                published_at=published_at,
                is_published=True,
                is_featured=False,
            )

            created_count += 1

            self.stdout.write(
                self.style.SUCCESS(
                    f"CREATED: {title}"
                )
            )

        self.stdout.write("")

        self.stdout.write(
            self.style.SUCCESS(
                f"Channel: {channel_title}"
            )
        )

        self.stdout.write(
            f"Scanned: {len(video_ids)}"
        )

        self.stdout.write(
            self.style.SUCCESS(
                f"Created: {created_count}"
            )
        )

        self.stdout.write(
            f"Updated: {updated_count}"
        )

        self.stdout.write(
            f"Skipped: {skipped_count}"
        )
