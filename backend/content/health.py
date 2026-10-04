from django.db import connection
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    SiteSettings,
    HomepageSlide,
    Event,
    GalleryImage,
    Testimony,
    BlogPost,
    SermonPDF,
    FASVideo,
    EBook,
)


class HealthView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        try:
            connection.ensure_connection()
            return Response({
                "status": "ok",
                "database": connection.vendor,
                "content": {
                    "settings": SiteSettings.objects.count(),
                    "published_slides": HomepageSlide.objects.filter(is_published=True).count(),
                    "upcoming_events": Event.objects.filter(is_published=True).count(),
                    "gallery": GalleryImage.objects.filter(is_published=True).count(),
                    "approved_testimonies": Testimony.objects.filter(is_approved=True).count(),
                    "published_blog": BlogPost.objects.filter(is_published=True).count(),
                    "published_sermons": SermonPDF.objects.filter(is_published=True).count(),
                    "published_videos": FASVideo.objects.filter(is_published=True).count(),
                    "published_ebooks": EBook.objects.filter(is_published=True).count(),
                },
            })
        except Exception:
            return Response({"status": "error"}, status=503)
