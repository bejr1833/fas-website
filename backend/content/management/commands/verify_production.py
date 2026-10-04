import os

from django.core.management.base import BaseCommand, CommandError
from django.db import connection

from content.models import SiteSettings, HomepageSlide


class Command(BaseCommand):
    help = "Verify that production is using persistent storage and that essential FAS content exists."

    def handle(self, *args, **options):
        if connection.vendor == "sqlite3" and not os.getenv("DEBUG", "False").lower() == "true":
            raise CommandError(
                "Production is using SQLite. Set DATABASE_URL to the persistent PostgreSQL database."
            )

        if not os.getenv("DATABASE_URL"):
            raise CommandError(
                "DATABASE_URL is missing. Refusing to start with an ephemeral/local database."
            )

        if not os.getenv("CLOUDINARY_URL"):
            raise CommandError(
                "CLOUDINARY_URL is missing. Refusing production deployment because uploaded media "
                "would be stored on ephemeral local disk."
            )

        required_settings = int(os.getenv("REQUIRED_SITE_SETTINGS", "1"))
        required_slides = int(os.getenv("REQUIRED_HOMEPAGE_SLIDES", "1"))

        settings_count = SiteSettings.objects.count()
        slides_count = HomepageSlide.objects.filter(is_published=True).count()

        if settings_count < required_settings:
            raise CommandError(
                f"Production content check failed: expected at least {required_settings} "
                f"SiteSettings record(s), found {settings_count}."
            )

        if slides_count < required_slides:
            raise CommandError(
                f"Production content check failed: expected at least {required_slides} "
                f"published homepage slide(s), found {slides_count}."
            )

        self.stdout.write(
            self.style.SUCCESS(
                "Production preflight passed: persistent PostgreSQL + Cloudinary + essential content are available."
            )
        )
