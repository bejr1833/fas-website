from rest_framework import serializers
from urllib.parse import urlparse, parse_qs



def optimize_image_url(url, width=1200):
    """Apply Cloudinary delivery optimizations when the URL is Cloudinary-hosted."""
    if not url or "res.cloudinary.com/" not in url or "/image/upload/" not in url:
        return url

    marker = "/image/upload/"
    prefix, suffix = url.split(marker, 1)
    if suffix.startswith("f_auto,q_auto/") or "f_auto" in suffix.split("/", 1)[0]:
        return url
    return f"{prefix}{marker}f_auto,q_auto,w_{width},c_limit/{suffix}"

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
)


class SiteSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteSettings
        fields = "__all__"


class HomepageSlideSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = HomepageSlide
        fields = "__all__"

    def get_image_url(self, obj):
        request = self.context.get("request")
        if not obj.image:
            return None
        url = optimize_image_url(obj.image.url, 1200)
        if request:
            return request.build_absolute_uri(url)
        return url


class EventSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = "__all__"

    def get_image_url(self, obj):
        request = self.context.get("request")
        if not obj.image:
            return None
        url = obj.image.url
        if request:
            return request.build_absolute_uri(url)
        return url


class GalleryImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = GalleryImage
        fields = "__all__"

    def get_image_url(self, obj):
        request = self.context.get("request")
        if not obj.image:
            return None
        url = obj.image.url
        if request:
            return request.build_absolute_uri(url)
        return url


class TestimonySerializer(serializers.ModelSerializer):
    photo = serializers.ImageField(
        required=False,
        allow_null=True,
        max_length=255,
        allow_empty_file=False,
    )

    class Meta:
        model = Testimony
        fields = (
            "id",
            "student_name",
            "college",
            "impact_statement",
            "testimony",
            "photo",
            "submitted_at",
        )

    def validate_photo(self, value):
        max_size = 5 * 1024 * 1024
        if value.size > max_size:
            raise serializers.ValidationError("Photo must be 5 MB or smaller.")

        allowed_types = {"image/jpeg", "image/png", "image/webp"}
        content_type = getattr(value, "content_type", None)
        if content_type and content_type not in allowed_types:
            raise serializers.ValidationError(
                "Only JPEG, PNG, or WebP images are allowed."
            )

        return value


class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = (
            "name",
            "email",
            "phone",
            "request_type",
            "message",
        )
        extra_kwargs = {
            "request_type": {
                "required": True,
            },
        }


class BlogPostSerializer(serializers.ModelSerializer):
    cover_image_url = serializers.SerializerMethodField()

    class Meta:
        model = BlogPost
        fields = "__all__"

    def get_cover_image_url(self, obj):
        request = self.context.get("request")
        if not obj.cover_image:
            return None
        url = optimize_image_url(obj.cover_image.url, 1200)
        if request:
            return request.build_absolute_uri(url)
        return url


class SermonPDFSerializer(serializers.ModelSerializer):
    pdf_file_url = serializers.SerializerMethodField()

    class Meta:
        model = SermonPDF
        fields = [
            "id",
            "pdf_file_url",
            "title",
            "speaker",
            "category",
            "description",
            "published_at",
            "is_published",
            "is_featured",
            "created_at",
            "updated_at",
        ]

    def get_pdf_file_url(self, obj):
        request = self.context.get("request")

        if not obj.pdf_file:
            return None

        filename = str(obj.pdf_file.name).split("/")[-1]

        # Keep the bundled Spurgeon PDF fallback.
        if filename == "charles-spurgeon-en.pdf":
            url = "/static/sermons/charles-spurgeon-en.pdf"

            if request:
                return request.build_absolute_uri(url)

            return url

        # Return the actual URL for uploaded sermon PDFs.
        try:
            url = obj.pdf_file.url
        except Exception:
            return None

        if request and url.startswith("/"):
            return request.build_absolute_uri(url)

        return url
class FASVideoSerializer(serializers.ModelSerializer):
    thumbnail_url = serializers.SerializerMethodField()

    class Meta:
        model = FASVideo
        fields = "__all__"
    def get_thumbnail_url(self, obj):
        request = self.context.get("request")

        # Prefer a manually uploaded thumbnail.
        if obj.thumbnail:
            url = optimize_image_url(obj.thumbnail.url, 800)
            if request:
                return request.build_absolute_uri(url)
            return url

        # Automatically use the YouTube thumbnail.
        video_url = (obj.video_url or "").strip()
        if not video_url:
            return None

        try:
            parsed = urlparse(video_url)
            host = parsed.netloc.lower().replace("www.", "")
            parts = [part for part in parsed.path.split("/") if part]
            video_id = None

            if host == "youtu.be" and parts:
                video_id = parts[0]
            elif host == "youtube.com":
                if parts and parts[0] == "watch":
                    video_id = parse_qs(parsed.query).get("v", [None])[0]
                elif parts and parts[0] in {"live", "shorts", "embed"} and len(parts) >= 2:
                    video_id = parts[1]

            if video_id:
                return f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg"
        except Exception:
            pass

        return None

class EBookSerializer(serializers.ModelSerializer):
    cover_image_url = serializers.SerializerMethodField()
    ebook_file_url = serializers.SerializerMethodField()

    class Meta:
        model = EBook
        fields = "__all__"

    def get_cover_image_url(self, obj):
        request = self.context.get("request")
        if not obj.cover_image:
            return None

        url = optimize_image_url(obj.cover_image.url, 800)

        if request:
            return request.build_absolute_uri(url)

        return url

    def get_ebook_file_url(self, obj):
        request = self.context.get("request")
        if not obj.ebook_file:
            return None

        url = obj.ebook_file.url

        if request:
            return request.build_absolute_uri(url)

        return url


class BlogCommentSerializer(serializers.ModelSerializer):
    class Meta:
        model = BlogComment
        fields = ("id", "name", "email", "comment", "created_at")
        read_only_fields = ("id", "created_at")
        extra_kwargs = {"email": {"write_only": True, "required": False}}


class BlogReactionSerializer(serializers.Serializer):
    reaction = serializers.ChoiceField(choices=["like", "amen", "encouraged"])
    visitor_key = serializers.CharField(min_length=16, max_length=64)

    def validate_visitor_key(self, value):
        if not value.isalnum():
            raise serializers.ValidationError("Invalid visitor key.")
        return value
