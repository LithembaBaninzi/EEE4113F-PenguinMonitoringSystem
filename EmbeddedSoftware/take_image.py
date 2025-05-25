from picamera2 import Picamera2
from datetime import datetime
import time
import sys

try:
    # Create timestamped filename
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    filename = f"/home/TuxNode/gSync/Images/IMG-{timestamp}.jpg"

    # Initialize and configure the camera
    picam2 = Picamera2()
    picam2.configure(picam2.create_still_configuration())
    picam2.start()

    # Enable continuous autofocus
    picam2.set_controls({"AfMode": 2})
    time.sleep(3)  # Allow autofocus to settle

    # Capture the photo
    picam2.capture_file(filename)
    # Print success message
    print(f"[{timestamp}] SUCCESS: Photo saved as {filename}")
except Exception as e:
    # Print failure message with error
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    print(f"[{timestamp}] ERROR: Failed to take photo - {e}", file=sys.stderr)
    sys.exit(1)
