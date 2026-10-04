from django.utils import timezone
from django.db import models

from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from .health import HealthView

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

from .serializers import (
    SiteSettingsSerializer,
    HomepageSlideSerializer,
    EventSerializer,
    GalleryImageSerializer,
    TestimonySerializer,
    ContactMessageSerializer,
    BlogPostSerializer,
    SermonPDFSerializer,
    FASVideoSerializer,
    EBookSerializer,
)


class HomeDataView(APIView):

    def get(self, request):

        today = timezone.localdate()

        settings_obj = SiteSettings.objects.first()

        slides = HomepageSlide.objects.filter(
            is_published=True
        ).filter(
            models.Q(start_date__isnull=True) | models.Q(start_date__lte=today)
        ).filter(
            models.Q(end_date__isnull=True) | models.Q(end_date__gte=today)
        ).order_by(
            "display_order",
            "-created_at",
        )

        events = Event.objects.filter(
            is_published=True,
            date__gte=today,
        ).order_by("date")[:6]

        gallery = GalleryImage.objects.filter(
            is_published=True
        ).order_by("-uploaded_at")

        stories = Testimony.objects.filter(
            is_approved=True
        ).order_by("-submitted_at")[:6]

        return Response({
            "settings": (
                SiteSettingsSerializer(
                    settings_obj,
                    context={"request": request}
                ).data
                if settings_obj
                else None
            ),

            "slides": HomepageSlideSerializer(
                slides,
                many=True,
                context={"request": request}
            ).data,

            "upcoming_events": EventSerializer(
                events,
                many=True,
                context={"request": request}
            ).data,

            "gallery": GalleryImageSerializer(
                gallery,
                many=True,
                context={"request": request}
            ).data,

            "stories": TestimonySerializer(
                stories,
                many=True,
                context={"request": request}
            ).data,
        })


class EventListView(generics.ListAPIView):

    serializer_class = EventSerializer

    def get_queryset(self):
        return Event.objects.filter(
            is_published=True
        ).order_by("date")


class TestimonyCreateView(generics.CreateAPIView):

    queryset = Testimony.objects.all()
    serializer_class = TestimonySerializer
    permission_classes = [permissions.AllowAny]
    http_method_names = ["post", "options"]

    # Public submissions are accepted, but the endpoint has no read/list action.
    # Global DRF throttling still limits anonymous abuse.
    def get_queryset(self):
        return Testimony.objects.none()


class ContactMessageCreateView(generics.CreateAPIView):

    queryset = ContactMessage.objects.all()
    serializer_class = ContactMessageSerializer
    permission_classes = [permissions.AllowAny]
    http_method_names = ["post", "options"]

    # Contact/prayer submissions are write-only through the public API.
    def get_queryset(self):
        return ContactMessage.objects.none()


class BlogPostListView(generics.ListAPIView):

    serializer_class = BlogPostSerializer

    def get_queryset(self):
        return BlogPost.objects.filter(
            is_published=True
        ).order_by(
            "-published_at",
            "-created_at",
        )


class BlogPostDetailView(generics.RetrieveAPIView):

    serializer_class = BlogPostSerializer
    lookup_field = "slug"

    def get_queryset(self):
        return BlogPost.objects.filter(
            is_published=True
        )


class SermonPDFListView(generics.ListAPIView):

    serializer_class = SermonPDFSerializer

    def get_queryset(self):
        return SermonPDF.objects.filter(
            is_published=True
        ).order_by(
            "-published_at",
            "-created_at",
        )


class FASVideoListView(generics.ListAPIView):

    serializer_class = FASVideoSerializer

    def get_queryset(self):
        return FASVideo.objects.filter(
            is_published=True
        ).order_by(
            "-published_at",
            "-created_at",
        )

class EBookListView(generics.ListAPIView):
    serializer_class = EBookSerializer

    def get_queryset(self):
        return EBook.objects.filter(
            is_published=True
        ).order_by(
            "-published_at",
            "-created_at"
        )

