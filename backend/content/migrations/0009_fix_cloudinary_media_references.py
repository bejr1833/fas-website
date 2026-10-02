from django.db import migrations


def fix_cloudinary_media_references(apps, schema_editor):
    HomepageSlide = apps.get_model("content", "HomepageSlide")
    GalleryImage = apps.get_model("content", "GalleryImage")

    # Homepage highlight
    HomepageSlide.objects.filter(
        id=1
    ).update(
        image="homepage-slides/Epignosis_Retreat.jpg"
    )

    # Gallery images
    gallery_updates = {
        1: "gallery/FAS_1st_retreat.jpeg",
        2: "gallery/FAS_2nd_Retreat.jpeg",
        3: "gallery/FAS_3rd_Retreat.jpeg",
        4: "gallery/FAS_4TH_Retreat.jpeg",
        5: "gallery/FAS_5th_retreat.jpeg",
        6: "gallery/FAS_6th_retreat.jpeg",
        7: "gallery/chris1.jpeg",
        8: "gallery/chris_2.jpeg",
        9: "gallery/cot2.jpeg",
        11: "gallery/cot3.jpeg",
        12: "gallery/cot4.jpeg",
    }

    for gallery_id, image_path in gallery_updates.items():
        GalleryImage.objects.filter(
            id=gallery_id
        ).update(
            image=image_path
        )


def reverse_cloudinary_media_references(apps, schema_editor):
    HomepageSlide = apps.get_model("content", "HomepageSlide")
    GalleryImage = apps.get_model("content", "GalleryImage")

    HomepageSlide.objects.filter(
        id=1
    ).update(
        image="homepage-slides/Epignosis_Retreat_idi6of"
    )

    gallery_updates = {
        1: "gallery/FAS_1st_retreat_b5okgv",
        2: "gallery/FAS_2nd_Retreat_hsz3dm",
        3: "gallery/FAS_3rd_Retreat_iplbzj",
        4: "gallery/FAS_4TH_Retreat_fzshls",
        5: "gallery/FAS_5th_retreat_vbztmn",
        6: "gallery/FAS_6th_retreat_fcbisf",
        7: "gallery/chris1_jtrigt",
        8: "gallery/chris_2_dg2mxx",
        9: "gallery/cot2_vcuboo",
        11: "gallery/cot3_fhhev5",
        12: "gallery/cot4_bcdoee",
    }

    for gallery_id, image_path in gallery_updates.items():
        GalleryImage.objects.filter(
            id=gallery_id
        ).update(
            image=image_path
        )


class Migration(migrations.Migration):

    dependencies = [
        ("content", "0008_alter_sermonpdf_pdf_file"),
    ]

    operations = [
        migrations.RunPython(
            fix_cloudinary_media_references,
            reverse_cloudinary_media_references,
        ),
    ]
