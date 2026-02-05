#
# Copyright 2015-2021, Institute for Systems Biology
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
import uuid
from datetime import timedelta

from django.db import models
from django.contrib.auth.models import User
import uuid
import re
import datetime
import base64
import logging

logger = logging.getLogger(__name__)

def cart_keygen():
    return re.sub(r'[^A-Za-z\d]',"",base64.b64encode(uuid.uuid4().bytes).decode('utf-8'))

CART_EXPIRATION = datetime.timedelta(days=5000)

class AppInfo(models.Model):
    id = models.AutoField(primary_key=True, null=False, blank=False)
    app_version = models.CharField(max_length=32, null=False, blank=False, default="1.0.0")
    app_name = models.CharField(max_length=128, null=False, blank=True)
    app_date = models.DateField(auto_now_add=True, null=False, blank=False)
    active = models.BooleanField(default=True, null=False, blank=False)

class User_Data(models.Model):
    id = models.AutoField(primary_key=True, null=False, blank=False)
    user = models.ForeignKey(User, null=False, blank=True, on_delete=models.CASCADE)
    history = models.CharField(max_length=2000, blank=False, null=False, default='')

class SharedCart(models.Model):
    cart_id = models.CharField(primary_key=True, max_length=64, null=False, blank=False, default=cart_keygen)
    source_ip = models.GenericIPAddressField(null=False, blank=False, default='0.0.0.0')
    created_on = models.DateTimeField(auto_now_add=True, null=False, blank=False)
    definition = models.TextField(null=False, blank=False, default='{}')
    series_ids = models.TextField(null=False, blank=False, default='')
    description = models.TextField(null=False, blank=False, default='')

    @classmethod
    def clear_expired_carts(cls):
        expired = cls.objects.filter(created_on__lte=datetime.datetime.now(datetime.UTC)-CART_EXPIRATION)
        expired.delete()

    @classmethod
    def get_carts_this_ip(cls, ip_addr):
        total_carts = cls.objects.filter(source_ip=ip_addr).length
        carts_per_min = ((cls.objects.filter(source_ip=ip_addr, created_on__gte=datetime.datetime.now(datetime.UTC)-timedelta(hours=2))).length)/120
        return { 'total': total_carts, 'per_min': carts_per_min }
