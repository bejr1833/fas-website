from rest_framework import serializers
from urllib.parse import urlparse, parse_qs

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
        url = obj.image.url
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
    class Meta:
        model = Testimony
        fields = (
            "id",
            "student_name",
            "college",
            "testimony",
            "photo",
            "submitted_at",
        )


class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = (
            "name",
            "email",
            "message",
        )


class BlogPostSerializer(serializers.ModelSerializer):
    cover_image_url = serializers.SerializerMethodField()

    class Meta:
        model = BlogPost
        fields = "__all__"

    def get_cover_image_url(self, obj):
        request = self.context.get("request")
        if not obj.cover_image:
            return None
        url = obj.cover_image.url
        if request:
            return request.build_absolute_uri(url)
        return url


class SermonPDFSerializer(serializers.ModelSerializer):
    pdf_file_url = serializers.SerializerMethodField()

    class Meta:
        model = SermonPDF
        fields = "__all__"

    def get_pdf_file_url(self, obj):
        request = self.context.get("request")
        if not obj.pdf_file:
            return None
        url = obj.pdf_file.url
        if request:
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
            url = obj.thumbnail.url
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

        url = obj.cover_image.url

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
