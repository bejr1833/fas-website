from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("content", "0016_event_meeting_and_speaker"),
    ]

    operations = [
        migrations.CreateModel(
            name="BlogComment",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=80)),
                ("email", models.EmailField(blank=True, max_length=254)),
                ("comment", models.TextField(max_length=2000)),
                ("is_approved", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("blog_post", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="comments", to="content.blogpost")),
            ],
            options={
                "ordering": ["-created_at"],
                "indexes": [
                    models.Index(fields=["blog_post", "-created_at"], name="content_blo_blog_po_7f3c5d_idx"),
                ],
            },
        ),
        migrations.CreateModel(
            name="BlogReaction",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("reaction", models.CharField(choices=[("like", "Like"), ("amen", "Amen"), ("encouraged", "Encouraged")], default="like", max_length=20)),
                ("visitor_key", models.CharField(max_length=64)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("blog_post", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="reactions", to="content.blogpost")),
            ],
            options={
                "indexes": [
                    models.Index(fields=["blog_post", "reaction"], name="content_blo_blog_po_0c2c1b_idx"),
                ],
            },
        ),
        migrations.AddConstraint(
            model_name="blogreaction",
            constraint=models.UniqueConstraint(fields=("blog_post", "visitor_key"), name="unique_blog_reaction_per_visitor"),
        ),
    ]
