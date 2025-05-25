#!/bin/bash

# Run checks
source /home/TuxNode/boot_logs/check_hardware.sh

# Define paths
SCRIPT_IMAGE="/home/TuxNode/progs/take_image.py"
SCRIPT_SERVER="/home/TuxNode/progs/serverCon.py"
LOG_FILE="/home/TuxNode/progs/capture.log"
REMOTE_FOLDER="gdrive:/TuxNode_Sync"
FAILED_DIR="/home/TuxNode/progs/resend"
IMAGE_DIR="/home/TuxNode/gSync/Images"

# Function to log timestamped output
echo  "----- Start of session -----" >> "$LOG_FILE"
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# Log and run image capture script
log "Starting image capture script"
if python3 "$SCRIPT_IMAGE" >> "$LOG_FILE" > /dev/null 2>&1; then
    log "Image capture completed successfully"
else
    log "Image capture failed"
fi

# Log and run server connection script
log "Starting server send script"
SERVER_OUTPUT=$(python3 "$SCRIPT_SERVER" 2>&1)
# Log it
echo "$SERVER_OUTPUT" >> "$LOG_FILE"
# If failed
if echo "$SERVER_OUTPUT" | grep -q "HTTPSConnectionPool"; then
    echo "Upload failed. Moving latest image to failed directory..." >> "$LOG_FILE"
    
    # Move most recent image (assuming .jpg or .png)
    LATEST_IMAGE=$(ls -t "$IMAGE_DIR"/*.jpg "$IMAGE_DIR"/*.png 2>/dev/null | head -n 1)
    
    if [ -n "$LATEST_IMAGE" ]; then
        cp "$LATEST_IMAGE" "$FAILED_DIR"/
        echo "Moved $LATEST_IMAGE to $FAILED_DIR/" >> "$LOG_FILE"
    else
        echo "No image found to move." >> "$LOG_FILE"
    fi
else
    echo "Upload succeeded." >> "$LOG_FILE"
fi


# Upload the log file to Google Drive
log "Uploading log file to Google Drive"
echo "----- End of session -----" >> "$LOG_FILE"
if rclone copy "$LOG_FILE" "$REMOTE_FOLDER" --create-empty-src-dirs >> "$LOG_FILE" > /dev/null 2>&1; then
    log "Log upload successful"
else
    log "Log upload failed"
fi

echo "----- End of Upload -----" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

