# Generated manually to remove duplicate emails

from django.db import migrations, models


def remove_duplicate_emails(apps, schema_editor):
    User = apps.get_model('accounts', 'User')
    # Find duplicate emails
    duplicates = User.objects.values('email').annotate(count=models.Count('id')).filter(count__gt=1, email__isnull=False)
    for dup in duplicates:
        email = dup['email']
        # Keep the first user, delete the rest
        users = User.objects.filter(email=email).order_by('id')
        users.exclude(id=users.first().id).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0003_alter_user_managers_alter_user_email'),
    ]

    operations = [
        migrations.RunPython(remove_duplicate_emails),
    ]
