import sys
import json
import time
import os
from datetime import datetime
import requests

# Folder with pictures
folder = "/home/TuxNode/gSync/Images"

# Server URL
url = 'https://b55725d9-1c14-44dc-9825-364d90efcfc2-00-1fu19gbp22g4a.worf.replit.dev/penguin'

# Parameters
threshold = 10;
now_ts = time.time()

# Find recent uploaded image
recent_image = None
for fname in sorted(os.listdir(folder), reverse=True):
    if fname.lower().endswith(".jpg"):
        full_path = os.path.join(folder, fname)
        mtime = os.path.getmtime(full_path)
        if now_ts - mtime <= threshold:
            recent_image = full_path
            break

if not recent_image:
    print("No recent image found in the last 10 seconds.")
    sys.exit(1)

# Extract timestamp from filename if you want, or use filename as ID
filename = os.path.basename(recent_image)
image_id = os.path.splitext(filename)[0]

# Get current date and time
now = datetime.now()
date = now.strftime("%Y-%m-%d")
time = now.strftime("%H:%M:%S")

# JSON metadata
data = {
    "weight": 5.5,
    "date": date,
    "time": time
}

# Open the image file in binary mode

try:
    with open(recent_image, 'rb') as img:
        files = {"image": img, "metadata": (None, json.dumps(data), "application/json")}
        try:
           response = requests.post(url, files=files, timeout=10)
           print("Status Code:", response.status_code)
           print("Server Response:", response.text)
        except requests.exceptions.RequestException as e:
           print("Error:", e)
except SSLError as e:
    print(f"SSL error while sending {image_path}: {e}")
except ConnectionError as e:
    print(f"Connection error while sending {image_path}: {e}")
except Exception as e:
    print(f"Unexpected error while sending {image_path}: {e}")
