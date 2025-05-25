#!/bin/bash

# Define log file location (e.g., in /var/log or your home directory)
LOG_DIR="/home/TuxNode/boot_logs/"
mkdir -p "$LOG_DIR"

# Get current timestamp
TIMESTAMP=$(date '+%Y%m%d-%H%M%S')
LOG_FILE="$LOG_DIR/boot_err_$TIMESTAMP.log"

# Header for clarity
echo "===== Boot Errors Captured on $TIMESTAMP =====" >> "$LOG_FILE"

# Append errors from journalctl
journalctl -p err -b >> "$LOG_FILE"

echo "===== Boot Errors End =====" >> "$LOG_FILE"
echo ""
