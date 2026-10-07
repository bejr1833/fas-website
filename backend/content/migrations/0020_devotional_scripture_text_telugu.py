from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("content", "0019_devotional_release_time"),
    ]

    operations = [
        migrations.AddField(
            model_name="devotional",
            name="scripture_text_telugu",
            field=models.TextField(blank=True),
        ),
    ]
