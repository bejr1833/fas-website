from django.db import migrations


SLUGS = [
    "christian-student-fellowship-community",
    "how-to-grow-spiritually-college-student",
    "how-to-study-the-bible-college-student",
    "not-every-feeling-is-gods-leading",
]


def remove_unintended_articles(apps, schema_editor):
    BlogPost = apps.get_model("content", "BlogPost")
    BlogPost.objects.filter(slug__in=SLUGS).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("content", "0014_seed_student_faith_articles"),
    ]

    operations = [
        migrations.RunPython(remove_unintended_articles, migrations.RunPython.noop),
    ]
