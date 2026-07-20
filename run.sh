#!/bin/sh
echo "==> Installing..."
pip install -q django psycopg-binary gunicorn dj-database-url django-htmx whitenoise
echo "==> Migrating..."
export DJANGO_SECRET_KEY=django-koc3d-prod-secret-2026
export DJANGO_DEBUG=true
python manage.py collectstatic --noinput --clear
python manage.py migrate --noinput --run-syncdb
echo "==> Starting..."
exec python manage.py runserver 0.0.0.0:8000 --noreload
