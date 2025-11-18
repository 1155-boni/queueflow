# Generated manually for adding organization_type field

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='organization_type',
            field=models.CharField(blank=True, choices=[('bank', 'Bank'), ('government', 'Government Official'), ('hospital', 'Hospital')], max_length=20, null=True),
        ),
    ]
