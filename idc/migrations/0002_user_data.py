# Generated by Django 2.2.28 on 2022-05-09 22:21

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('idc', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='User_Data',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('history', models.CharField(default='', max_length=2000)),
                ('user', models.ForeignKey(blank=True, on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
