"""

Copyright 2015, Institute for Systems Biology

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

WSGI config for GAE_Django17 project.

This module contains the WSGI application used by Django's development server
and any production WSGI deployments. It should expose a module-level variable
named ``application``. Django's ``runserver`` and ``runfcgi`` commands discover
this application via the ``WSGI_APPLICATION`` setting.

Usually you will have the standard Django WSGI application here, but it also
might make sense to replace the whole Django WSGI application with a custom one
that later delegates to the Django one. For example, you could introduce WSGI
middleware here, or combine a Django application with an application of another
framework.

"""

# os.environ.setdefault("DJANGO_SETTINGS_MODULE", "GenespotRE.prod_settings")

# This application object is used by any WSGI server configured to use this
# file. This includes Django's development server, if the WSGI_APPLICATION
# setting points here.
from django.core.wsgi import get_wsgi_application

import sys, os

forwarded_allow_ips = '*'
secure_scheme_headers = {'X-APPENGINE-HTTPS': 'on'}

application = get_wsgi_application()

print >> sys.stdout, "__name__ =", __name__
print >> sys.stdout, "__file__ =", __file__
print >> sys.stdout, "os.getpid() =", os.getpid()
print >> sys.stdout, "os.getcwd() =", os.getcwd()
print >> sys.stdout, "os.curdir =", os.curdir
print >> sys.stdout, "sys.path =", repr(sys.path)
print >> sys.stdout, "sys.modules.keys() =", repr(sys.modules.keys())
print >> sys.stdout, "sys.modules.has_key('mysite') =", sys.modules.has_key('mysite')
if sys.modules.has_key('mysite'):
  print >> sys.stdout, "sys.modules['mysite'].__name__ =", sys.modules['mysite'].__name__
  print >> sys.stdout, "sys.modules['mysite'].__file__ =", sys.modules['mysite'].__file__
  print >> sys.stdout, "os.environ['DJANGO_SETTINGS_MODULE'] =", os.environ.get('DJANGO_SETTINGS_MODULE', None)

print >> sys.stdout, "[STATUS] Successfully retrieved application in wsgi.py"

# Apply WSGI middleware here.
# from helloworld.wsgi import HelloWorldApplication
# application = HelloWorldApplication(application)

