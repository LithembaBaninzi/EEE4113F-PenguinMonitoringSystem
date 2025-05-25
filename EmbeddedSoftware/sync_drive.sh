#!/bin/bash
echo "==== Sync started at $(date) ===="

ping -c 1 google.com &> /dev/null
if [ $? -ne 0 ]; then
    echo "No internet connection. Sync aborted."
    exit 1
fi

rclone copy /home/TuxNode/gSync/ gdrive:/TuxNode_Sync --create-empty-src-dirs

if [ $? -eq 0 ]; then
    echo "Sync successful."
else
    echo "Sync failed."
fi

echo "==== Sync ended at $(date) ===="
echo ""
