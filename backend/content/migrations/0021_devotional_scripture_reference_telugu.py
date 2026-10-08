from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("content", "0020_devotional_scripture_text_telugu"),
    ]

    operations = [
        migrations.AddField(
            model_name="devotional",
            name="scripture_reference_telugu",
            field=models.CharField(blank=True, max_length=160),
        ),
    ]
