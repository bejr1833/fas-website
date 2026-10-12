# Generated for FAS ebook format and copyright safeguards.
import django.core.validators
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("content", "0006_ebook"),
    ]

    operations = [
        migrations.AlterField(
            model_name="ebook",
            name="ebook_file",
            field=models.FileField(
                blank=True,
                help_text="Upload a PDF copy only if FAS has permission to redistribute it. Either PDF or EPUB is required.",
                upload_to="ebooks/files/",
                validators=[django.core.validators.FileExtensionValidator(["pdf"])],
                verbose_name="PDF file",
            ),
        ),
        migrations.AddField(
            model_name="ebook",
            name="epub_file",
            field=models.FileField(
                blank=True,
                help_text="Optional EPUB copy. Upload only when redistribution is permitted.",
                upload_to="ebooks/files/",
                validators=[django.core.validators.FileExtensionValidator(["epub"])],
                verbose_name="EPUB file",
            ),
        ),
        migrations.AddField(
            model_name="ebook",
            name="rights_status",
            field=models.CharField(
                choices=[
                    ("pending", "Pending review — do not publish"),
                    ("original", "Original / owned by FAS"),
                    ("public_domain", "Public domain — verified"),
                    ("permission_granted", "Written permission granted"),
                    ("open_license", "Open licence permits redistribution"),
                ],
                default="pending",
                help_text="Select the documented legal basis for hosting this book.",
                max_length=24,
            ),
        ),
        migrations.AddField(
            model_name="ebook",
            name="rights_verified",
            field=models.BooleanField(
                default=False,
                help_text="Tick only after checking the source, edition, licence/permission, and allowed file formats.",
            ),
        ),
        migrations.AddField(
            model_name="ebook",
            name="rights_source_url",
            field=models.URLField(
                blank=True,
                help_text="Official source, licence page, permission record, or public-domain evidence.",
            ),
        ),
        migrations.AddField(
            model_name="ebook",
            name="rights_notes",
            field=models.TextField(
                blank=True,
                help_text="Record permission scope, licence conditions, rights-holder contact, and verification notes.",
            ),
        ),
    ]
