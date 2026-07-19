#!/bin/sh
set -e
echo "==> Installing deps..."
apt-get update -qq
apt-get install -y -qq libpq-dev gcc curl
pip install -q django psycopg-binary gunicorn dj-database-url django-htmx

echo "==> Downloading source..."
curl -sL https://github.com/ikhlaau/kings-of-chaos-3d/archive/refs/heads/main.tar.gz | tar xz --strip-components=1

echo "==> Running migrations..."
python manage.py migrate --noinput

echo "==> Starting server..."
exec gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 2
