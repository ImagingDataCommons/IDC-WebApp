###
#
# Copyright 2017, Institute for Systems Biology
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
###

# Dockerfile extending the generic Python image with application files for a
# single application.
FROM python:3.9-bullseye

RUN apt-get update
ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get install -y mysql-server

RUN apt-get -y install build-essential
RUN apt-get -y install --reinstall python-m2crypto python3-crypto
RUN apt-get -y install libxml2-dev libxmlsec1-dev swig
RUN pip install pexpect

RUN apt-get -y install unzip libffi-dev libssl-dev libmysqlclient-dev python3-mysqldb python3-dev libpython3-dev git ruby g++ curl
RUN easy_install -U distribute

ADD . /app

# We need to recompile some of the items because of differences in compiler versions
RUN pip install -r /app/requirements.txt -t /app/lib/ --upgrade
RUN pip install gunicorn==19.6.0

ENV PYTHONPATH=/app:/app/lib:/app/IDC-Common:${PYTHONPATH}

# Check Axes config
RUN python3 manage.py check

# Until we figure out a way to do it in CircleCI without whitelisting IPs this has to be done by a dev from
# ISB
# RUN python /app/manage.py migrate --noinput

CMD gunicorn -c gunicorn.conf.py -b :$PORT idc.wsgi -w 5 -t 70
