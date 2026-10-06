from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("content", "0017_blog_comments_reactions"),
    ]

    operations = [
        migrations.CreateModel(
            name="Devotional",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("title", models.CharField(max_length=200)),
                ("slug", models.SlugField(max_length=220, unique=True)),
                ("date", models.DateField()),
                ("author", models.CharField(default="FAS", max_length=120)),
                ("scripture_reference", models.CharField(max_length=160)),
                ("scripture_text", models.TextField()),
                ("impact_line", models.CharField(max_length=220)),
                ("reflection", models.TextField()),
                ("prayer", models.TextField()),
                ("application", models.TextField(blank=True)),
                ("is_published", models.BooleanField(default=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "ordering": ["-date", "-created_at"],
            },
        ),
        migrations.AddIndex(
            model_name="devotional",
            index=models.Index(fields=["-date", "is_published"], name="content_dev_date_7a9f3b_idx"),
        ),
    ]
