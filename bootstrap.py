#!/usr/bin/env python3
"""Bootstrap script for Dokploy deployment."""
import subprocess, sys, os

def run(cmd):
    print(f"==> {cmd}")
    subprocess.run(cmd, shell=True, check=True)

# Install deps
run("pip install -q django psycopg-binary gunicorn dj-database-url django-htmx")

# Download source
run("pip install -q requests")
import requests, tarfile, io
print("==> Downloading source...")
r = requests.get("https://github.com/ikhlaau/kings-of-chaos-3d/archive/refs/heads/main.tar.gz")
tarfile.open(fileobj=io.BytesIO(r.content)).extractall()
# Move files from the extracted dir to current dir
import glob, shutil
extracted = glob.glob("kings-of-chaos-3d-*")[0]
for item in os.listdir(extracted):
    s = os.path.join(extracted, item)
    d = os.path.join(".", item)
    if os.path.exists(d):
        if os.path.isdir(d): shutil.rmtree(d)
        else: os.remove(d)
    shutil.move(s, d)
os.rmdir(extracted)

# Migrate
os.environ.setdefault("DJANGO_SECRET_KEY", "django-koc3d-prod-secret-2026")
run("python manage.py migrate --noinput")

# Start
print("==> Starting gunicorn...")
os.execvp("gunicorn", ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "2"])
