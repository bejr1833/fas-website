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
    BlogReaction,
    BlogComment,
    Devotional,
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
    BlogCommentSerializer,
    BlogReactionSerializer,
    DevotionalSerializer,
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

        devotional = Devotional.objects.filter(
            is_published=True,
            date__lte=today,
        ).order_by("-date", "-created_at").first()

        devotional_calendar = Devotional.objects.filter(
            is_published=True,
        ).order_by("date", "-created_at")

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

            "devotional": (
                DevotionalSerializer(
                    devotional,
                    context={"request": request}
                ).data
                if devotional
                else None
            ),

            "devotionals": DevotionalSerializer(
                devotional_calendar,
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

    def perform_create(self, serializer):
        contact_message = serializer.save()

        # Keep Django/Postgres as the source of truth. Google Sheets is a
        # secondary delivery channel, so a Sheets outage never loses a request.
        from .google_sheets import is_configured, sync_contact_message

        if is_configured():
            try:
                sync_contact_message(contact_message)
            except Exception:
                import logging
                logging.getLogger(__name__).exception(
                    "Google Sheets sync failed for ContactMessage #%s",
                    contact_message.pk,
                )


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


class DevotionalListView(generics.ListAPIView):
    serializer_class = DevotionalSerializer

    def get_queryset(self):
        # Return scheduled and published devotionals so the calendar can
        # display future readings as soon as they are prepared in admin.
        return Devotional.objects.filter(
            is_published=True,
        ).order_by("date", "-created_at")


class DevotionalDetailView(generics.RetrieveAPIView):
    serializer_class = DevotionalSerializer
    lookup_field = "slug"

    def get_queryset(self):
        return Devotional.objects.filter(is_published=True)


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



class BlogEngagementView(APIView):
    permission_classes = [permissions.AllowAny]

    def get_blog(self, slug):
        return BlogPost.objects.filter(is_published=True, slug=slug).first()

    def get(self, request, slug):
        blog = self.get_blog(slug)
        if not blog:
            return Response({"detail": "Blog article not found."}, status=404)

        comments = blog.comments.filter(is_approved=True)
        reaction_counts = {
            key: blog.reactions.filter(reaction=key).count()
            for key, _ in BlogReaction.REACTION_CHOICES
        }

        visitor_key = request.query_params.get("visitor_key", "")
        active_reaction = None
        if visitor_key:
            active = blog.reactions.filter(visitor_key=visitor_key).first()
            active_reaction = active.reaction if active else None

        return Response({
            "comments": BlogCommentSerializer(comments, many=True).data,
            "reaction_counts": reaction_counts,
            "total_reactions": sum(reaction_counts.values()),
            "active_reaction": active_reaction,
        })

    def post(self, request, slug):
        blog = self.get_blog(slug)
        if not blog:
            return Response({"detail": "Blog article not found."}, status=404)

        serializer = BlogCommentSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        comment = serializer.save(blog_post=blog)
        return Response(
            BlogCommentSerializer(comment).data,
            status=201,
        )


class BlogReactionView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, slug):
        blog = BlogPost.objects.filter(is_published=True, slug=slug).first()
        if not blog:
            return Response({"detail": "Blog article not found."}, status=404)

        serializer = BlogReactionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        reaction = serializer.validated_data["reaction"]
        visitor_key = serializer.validated_data["visitor_key"]

        existing = BlogReaction.objects.filter(
            blog_post=blog,
            visitor_key=visitor_key,
        ).first()

        if existing and existing.reaction == reaction:
            existing.delete()
            active_reaction = None
        elif existing:
            existing.reaction = reaction
            existing.save(update_fields=["reaction"])
            active_reaction = reaction
        else:
            BlogReaction.objects.create(
                blog_post=blog,
                reaction=reaction,
                visitor_key=visitor_key,
            )
            active_reaction = reaction

        reaction_counts = {
            key: blog.reactions.filter(reaction=key).count()
            for key, _ in BlogReaction.REACTION_CHOICES
        }

        return Response({
            "reaction_counts": reaction_counts,
            "total_reactions": sum(reaction_counts.values()),
            "active_reaction": active_reaction,
        })
