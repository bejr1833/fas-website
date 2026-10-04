from django.urls import path

from .views import (
    HealthView,
    HomeDataView,
    EventListView,
    TestimonyCreateView,
    ContactMessageCreateView,
    BlogPostListView,
    BlogPostDetailView,
    SermonPDFListView,
    FASVideoListView,
    EBookListView,
)

urlpatterns = [
    path("health/", HealthView.as_view(), name="health"),
    path("ebooks/", EBookListView.as_view(), name="ebooks"),
    path("home/", HomeDataView.as_view(), name="home"),
    path("events/", EventListView.as_view(), name="events"),
    path("testimonies/", TestimonyCreateView.as_view(), name="testimonies"),
    path("contact/", ContactMessageCreateView.as_view(), name="contact"),

    path("blog/", BlogPostListView.as_view(), name="blog-list"),
    path("blog/<slug:slug>/", BlogPostDetailView.as_view(), name="blog-detail"),
    path("sermons/", SermonPDFListView.as_view(), name="sermons"),
    path("videos/", FASVideoListView.as_view(), name="videos"),
]
