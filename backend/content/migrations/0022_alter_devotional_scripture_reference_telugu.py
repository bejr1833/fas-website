from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("content", "0021_devotional_scripture_reference_telugu"),
    ]

    operations = [
        migrations.AlterField(
            model_name="devotional",
            name="scripture_reference_telugu",
            field=models.CharField(
                blank=True,
                max_length=160,
                verbose_name="Scripture reference (Telugu)",
            ),
        ),
    ]
