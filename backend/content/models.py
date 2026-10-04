from django.db import models
from cloudinary_storage.storage import RawMediaCloudinaryStorage

class SiteSettings(models.Model):
    organization_name = models.CharField(max_length=120, default="Faith Alone Saves")
    tagline = models.CharField(max_length=160, default="LOVE IN FELLOWSHIP & TRUTH")
    hero_title = models.CharField(max_length=180, default="Growing together in Christ.")
    hero_intro = models.TextField(default="Equipping campus students to grow in God's Word, use their spiritual gifts, and selflessly impact their campuses.")
    vision = models.TextField(default="To equip campus students wholistically - grounding them in God's Word, helping them worship and exercise their spiritual gifts, and inspiring them to selflessly expand God's Kingdom.")
    mission = models.TextField(default="Connecting students through online meetings, in-person gatherings, and retreats; nurturing them wholistically through God's Word and mentorship; and creating opportunities for them to use their spiritual gifts to lead, serve, and selflessly impact their campuses.")
    whatsapp_url = models.URLField(blank=True)
    instagram_url = models.URLField(blank=True)
    youtube_url = models.URLField(blank=True)
    email = models.EmailField(blank=True)
    tuesday_time = models.CharField(max_length=80, default="Every Tuesday - 7:00 PM")
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.organization_name


class HomepageSlide(models.Model):
    CATEGORY_CHOICES = [
        ("poster", "Poster"),
        ("highlight", "Highlight"),
        ("update", "Update"),
        ("event", "Event"),
        ("announcement", "Announcement"),
    ]

    title = models.CharField(max_length=180)
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES, default="update")
    image = models.ImageField(upload_to="homepage-slides/")
    description = models.TextField(blank=True)
    button_text = models.CharField(max_length=80, blank=True)
    button_url = models.URLField(blank=True)
    display_order = models.PositiveIntegerField(default=0)
    is_published = models.BooleanField(default=True)
    start_date = models.DateField(blank=True, null=True)
    end_date = models.DateField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["display_order", "-created_at"]

    def __str__(self):
        return self.title


class Event(models.Model):
    EVENT_TYPES = [
        ("bible-study", "Bible Study"),
        ("discussion", "Discussion"),
        ("retreat", "Retreat"),
        ("worship", "Worship Service"),
        ("fellowship", "Fellowship"),
        ("other", "Other"),
    ]
    title = models.CharField(max_length=180)
    event_type = models.CharField(max_length=30, choices=EVENT_TYPES, default="other")
    date = models.DateField()
    time = models.CharField(max_length=80, blank=True)
    mode = models.CharField(max_length=30, default="Online")
    location = models.CharField(max_length=180, blank=True)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to="events/", blank=True, null=True)
    registration_url = models.URLField(blank=True)
    meeting_url = models.URLField(blank=True)
    speaker_name = models.CharField(max_length=120, blank=True)
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["date"]

    def __str__(self):
        return self.title


class GalleryImage(models.Model):
    CATEGORY_CHOICES = [
        ("retreats", "Retreats"),
        ("events", "FAS Events"),
        ("camps-conferences", "Camps & Conferences"),
        ("cottage-prayer", "Cottage Prayer & Fellowship"),
        ("bible-study", "Bible Study"),
        ("worship-prayer", "Worship & Prayer"),
        ("outreach-mission", "Outreach & Mission"),
        ("fellowship-gatherings", "Fellowship & Gatherings"),
    ]

    title = models.CharField(max_length=160, blank=True)
    image = models.ImageField(upload_to="gallery/")
    category = models.CharField(
        max_length=40,
        choices=CATEGORY_CHOICES,
        default="events",
    )
    caption = models.CharField(max_length=240, blank=True)
    is_published = models.BooleanField(default=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title or f"Gallery image #{self.pk}"


class Testimony(models.Model):
    student_name = models.CharField(max_length=120)
    college = models.CharField(max_length=160, blank=True)
    impact_statement = models.CharField(max_length=180, blank=True)
    testimony = models.TextField()
    photo = models.ImageField(upload_to="testimonies/", blank=True, null=True)
    is_approved = models.BooleanField(default=False)
    submitted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-submitted_at"]

    def __str__(self):
        return self.student_name


class ContactMessage(models.Model):
    REQUEST_TYPE_CHOICES = [
        ("prayer", "Prayer Request"),
        ("message", "Message"),
    ]

    STATUS_CHOICES = [
        ("new", "New"),
        ("read", "Read"),
        ("responded", "Responded"),
        ("archived", "Archived"),
    ]

    name = models.CharField(max_length=120)
    email = models.EmailField()
    phone = models.CharField(max_length=30, blank=True)
    request_type = models.CharField(
        max_length=20,
        choices=REQUEST_TYPE_CHOICES,
        default="message",
    )
    message = models.TextField(max_length=5000)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="new",
    )
    admin_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} - {self.get_request_type_display()}"

class BlogPost(models.Model):
    CATEGORY_CHOICES = [
        ("bible-study", "Bible Study"),
        ("christian-life", "Christian Life"),
        ("student-life", "Student Life"),
        ("faith", "Faith"),
        ("testimony", "Testimony"),
        ("fas-updates", "FAS Updates"),
        ("other", "Other"),
    ]

    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True)
    author = models.CharField(max_length=120, default="FAS")
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES, default="other")
    cover_image = models.ImageField(upload_to="blog/covers/", blank=True, null=True)
    excerpt = models.TextField(max_length=400, blank=True)
    content = models.TextField()
    is_published = models.BooleanField(default=False)
    is_featured = models.BooleanField(default=False)
    published_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-published_at", "-created_at"]

    def __str__(self):
        return self.title
class SermonPDF(models.Model):
    CATEGORY_CHOICES = [
        ("bible-study", "Bible Study"),
        ("sermon", "Sermon"),
        ("devotional", "Devotional"),
        ("worship", "Worship"),
        ("conference", "Conference"),
        ("other", "Other"),
    ]

    title = models.CharField(max_length=200)
    speaker = models.CharField(max_length=120, default="FAS")
    category = models.CharField(
        max_length=30,
        choices=CATEGORY_CHOICES,
        default="sermon",
    )
    description = models.TextField(blank=True)
    pdf_file = models.FileField(
        upload_to="sermons/pdfs/",
        storage=RawMediaCloudinaryStorage(),
    )
    published_at = models.DateTimeField(blank=True, null=True)
    is_published = models.BooleanField(default=False)
    is_featured = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-published_at", "-created_at"]

    def __str__(self):
        return self.title

class FASVideo(models.Model):
    CATEGORY_CHOICES = [
        ("bible-study", "Bible Study"),
        ("sermon", "Sermon"),
        ("worship", "Worship"),
        ("testimony", "Testimony"),
        ("retreat", "Retreat"),
        ("fas-updates", "FAS Updates"),
        ("other", "Other"),
    ]

    title = models.CharField(max_length=200)
    speaker = models.CharField(max_length=120, default="FAS")
    category = models.CharField(
        max_length=30,
        choices=CATEGORY_CHOICES,
        default="other",
    )
    thumbnail = models.ImageField(
        upload_to="videos/thumbnails/",
        blank=True,
        null=True,
    )
    description = models.TextField(blank=True)
    video_url = models.URLField()
    published_at = models.DateTimeField(blank=True, null=True)
    is_published = models.BooleanField(default=False)
    is_featured = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-published_at", "-created_at"]

    def __str__(self):
        return self.title

class EBook(models.Model):
    CATEGORY_CHOICES = [
        ("bible-study", "Bible Study"),
        ("christian-life", "Christian Life"),
        ("student-life", "Student Life"),
        ("devotional", "Devotional"),
        ("faith", "Faith"),
        ("testimony", "Testimony"),
        ("other", "Other"),
    ]

    title = models.CharField(max_length=200)
    author = models.CharField(max_length=120, default="FAS")
    category = models.CharField(
        max_length=30,
        choices=CATEGORY_CHOICES,
        default="other",
    )
    cover_image = models.ImageField(
        upload_to="ebooks/covers/",
        blank=True,
        null=True,
    )
    description = models.TextField(blank=True)
    ebook_file = models.FileField(
        upload_to="ebooks/files/",
    )
    published_at = models.DateTimeField(
        blank=True,
        null=True,
    )
    is_published = models.BooleanField(default=False)
    is_featured = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-published_at", "-created_at"]

    def __str__(self):
        return self.title
