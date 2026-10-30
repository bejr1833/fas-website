from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("content", "0022_alter_devotional_scripture_reference_telugu"),
    ]

    operations = [
        migrations.AddField(
            model_name="contactmessage",
            name="email_consent",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="contactmessage",
            name="acknowledgment_email_sent_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="contactmessage",
            name="followup_email_sent_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
