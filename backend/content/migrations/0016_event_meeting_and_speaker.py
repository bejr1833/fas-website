from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("content", "0015_remove_unintended_blog_articles"),
    ]

    operations = [
        migrations.AddField(
            model_name="event",
            name="meeting_url",
            field=models.URLField(blank=True),
        ),
        migrations.AddField(
            model_name="event",
            name="speaker_name",
            field=models.CharField(blank=True, max_length=120),
        ),
    ]
