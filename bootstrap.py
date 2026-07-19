#!/usr/bin/env python3
"""Bootstrap script for Dokploy deployment — uses stdlib only."""
import subprocess, os, urllib.request, tarfile, io, glob, shutil

def run(cmd):
    print(f"==> {cmd}", flush=True)
    subprocess.run(cmd, shell=True, check=True)

# Install deps
run("pip install -q django psycopg-binary gunicorn dj-database-url django-htmx")

# Download source
print("==> Downloading source...", flush=True)
r = urllib.request.urlopen("https://github.com/ikhlaau/kings-of-chaos-3d/archive/refs/heads/main.tar.gz")
tf = tarfile.open(fileobj=io.BytesIO(r.read()))
tf.extractall()
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
run("python manage.py migrate --noinput")

# Start
print("==> Starting gunicorn...", flush=True)
os.execvp("gunicorn", ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "2"])
