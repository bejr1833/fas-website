from django.db import migrations, models
from datetime import time


class Migration(migrations.Migration):
    dependencies = [
        ("content", "0018_devotional"),
    ]

    operations = [
        migrations.AddField(
            model_name="devotional",
            name="release_time",
            field=models.TimeField(default=time(5, 0)),
        ),
    ]
