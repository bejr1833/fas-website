from django.contrib import admin

from .models import (
    SiteSettings,
    Event,
    GalleryImage,
    Testimony,
    ContactMessage,
    HomepageSlide,
    BlogPost,
    SermonPDF,
    FASVideo,
    EBook,
    BlogComment,
    BlogReaction,
    Devotional,
)


class SiteSettingsAdmin(admin.ModelAdmin):
    list_display = ("organization_name", "tagline", "updated_at")


@admin.register(HomepageSlide)
class HomepageSlideAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "category",
        "display_order",
        "is_published",
        "start_date",
        "end_date",
    )
    list_filter = (
        "category",
        "is_published",
    )
    search_fields = (
        "title",
        "description",
    )
    ordering = (
        "display_order",
        "-created_at",
    )


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "event_type",
        "date",
        "time",
        "mode",
        "speaker_name",
        "location",
        "is_published",
    )
    list_filter = (
        "event_type",
        "mode",
        "is_published",
    )
    search_fields = (
        "title",
        "description",
        "speaker_name",
        "location",
    )
    fieldsets = (
        ("Event Details", {"fields": ("title", "event_type", "date", "time", "mode", "location", "description", "image")}),
        ("Online Meeting", {"fields": ("meeting_url", "speaker_name", "registration_url")}),
        ("Publishing", {"fields": ("is_published", "created_at")}),
    )
    readonly_fields = ("created_at",)
    date_hierarchy = "date"


@admin.register(GalleryImage)
class GalleryImageAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "category",
        "is_published",
        "uploaded_at",
    )
    list_filter = (
        "category",
        "is_published",
    )


@admin.register(Testimony)
class TestimonyAdmin(admin.ModelAdmin):
    list_display = (
        "student_name",
        "college",
        "impact_statement",
        "is_approved",
        "submitted_at",
    )
    list_filter = (
        "is_approved",
    )
    search_fields = (
        "student_name",
        "college",
        "impact_statement",
        "testimony",
    )
    fieldsets = (
        (
            "Student",
            {
                "fields": (
                    "student_name",
                    "college",
                    "photo",
                )
            },
        ),
        (
            "Story",
            {
                "fields": (
                    "impact_statement",
                    "testimony",
                )
            },
        ),
        (
            "Publishing",
            {
                "fields": (
                    "is_approved",
                    "submitted_at",
                )
            },
        ),
    )
    readonly_fields = (
        "submitted_at",
    )


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "email",
        "phone",
        "request_type",
        "status",
        "created_at",
    )
    list_filter = (
        "request_type",
        "status",
        "created_at",
    )
    search_fields = (
        "name",
        "email",
        "message",
        "admin_notes",
    )
    readonly_fields = (
        "created_at",
    )
    fieldsets = (
        (
            "Contact",
            {
                "fields": (
                    "name",
                    "email",
                    "phone",
                    "request_type",
                )
            },
        ),
        (
            "Message",
            {
                "fields": (
                    "message",
                )
            },
        ),
        (
            "Admin",
            {
                "fields": (
                    "status",
                    "admin_notes",
                    "created_at",
                )
            },
        ),
    )

@admin.register(BlogPost)
class BlogPostAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "category",
        "author",
        "is_published",
        "is_featured",
        "published_at",
    )
    list_filter = (
        "category",
        "is_published",
        "is_featured",
    )
    search_fields = (
        "title",
        "author",
        "excerpt",
        "content",
    )
    prepopulated_fields = {
        "slug": ("title",),
    }
    date_hierarchy = "published_at"


@admin.register(SermonPDF)
class SermonPDFAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "speaker",
        "category",
        "is_published",
        "is_featured",
        "published_at",
    )
    list_filter = (
        "category",
        "is_published",
        "is_featured",
    )
    search_fields = (
        "title",
        "speaker",
        "description",
    )
    date_hierarchy = "published_at"


@admin.register(FASVideo)
class FASVideoAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "speaker",
        "category",
        "is_published",
        "is_featured",
        "published_at",
    )
    list_filter = (
        "category",
        "is_published",
        "is_featured",
    )
    search_fields = (
        "title",
        "speaker",
        "description",
    )
    date_hierarchy = "published_at"

@admin.register(EBook)
class EBookAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "author",
        "category",
        "is_published",
        "is_featured",
        "published_at",
    )
    list_filter = (
        "category",
        "is_published",
        "is_featured",
    )
    search_fields = (
        "title",
        "author",
        "description",
    )
    date_hierarchy = "published_at"

admin.site.register(SiteSettings, SiteSettingsAdmin)


@admin.register(BlogComment)
class BlogCommentAdmin(admin.ModelAdmin):
    list_display = ("name", "blog_post", "is_approved", "created_at")
    list_filter = ("is_approved", "created_at")
    search_fields = ("name", "email", "comment", "blog_post__title")
    readonly_fields = ("created_at",)


@admin.register(BlogReaction)
class BlogReactionAdmin(admin.ModelAdmin):
    list_display = ("blog_post", "reaction", "visitor_key", "created_at")
    list_filter = ("reaction", "created_at")
    search_fields = ("blog_post__title", "visitor_key")
    readonly_fields = ("created_at",)


@admin.register(Devotional)
class DevotionalAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "date",
        "author",
        "is_published",
    )
    list_filter = ("is_published", "date")
    search_fields = (
        "title",
        "author",
        "scripture_reference",
        "impact_line",
        "reflection",
    )
    prepopulated_fields = {"slug": ("title",)}
    date_hierarchy = "date"
    fieldsets = (
        ("Devotional Details", {
            "fields": (
                "title", "slug", "date", "author",
                "scripture_reference", "scripture_text",
                "impact_line",
            )
        }),
        ("Message", {
            "fields": ("reflection", "prayer", "application")
        }),
        ("Publishing", {
            "fields": ("is_published", "created_at", "updated_at")
        }),
    )
    readonly_fields = ("created_at", "updated_at")
