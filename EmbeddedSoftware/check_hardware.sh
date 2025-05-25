#!/bin/bash

LOG_DIR="/home/TuxNode/boot_logs"
mkdir -p "$LOG_DIR"
TIMESTAMP=$(date '+%Y%m%d-%H%M%S')
LOG_FILE="$LOG_DIR/hardware.log"

echo "===== Hardware Check - $TIMESTAMP =====" >> "$LOG_FILE"
sleep 10

# --- Check Pi Camera ---
if libcamera-hello --list-cameras 2>/dev/null | grep -q "^0 :"; then
    echo "[✓] Pi Camera detected by libcamera" >> "$LOG_FILE"
else
    echo "[✗] Pi Camera not detected by libcamera" >> "$LOG_FILE"
fi

# RTC Check
if i2cdetect -y 1 | grep -q "60:.*UU"; then
    echo "[✓] RTC module (0x68) detected on I2C bus 1" >> "$LOG_FILE"
else
    echo "[✗] RTC module not detected on I2C bus 1" >> "$LOG_FILE"
fi

# WiFi Check
SSID=$(iwgetid -r)
if [ -n "$SSID" ]; then
    echo "[✓] Connected to Wi-Fi network: $SSID" >> "$LOG_FILE"
else
    echo "[✗] Not connected to any Wi-Fi network" >> "$LOG_FILE"
fi

# --- Check GPIO pins 5 and 6 (BCM numbering: 5=Pin 29, 6=Pin 31) ---
#for GPIO in 5 6; do
#    if [ ! -d "/sys/class/gpio/gpio$GPIO" ]; then
#        echo "$GPIO" > /sys/class/gpio/export
#        sleep 0.5
#    fi
#    echo "in" > /sys/class/gpio/gpio$GPIO/direction
#    VALUE=$(cat /sys/class/gpio/gpio$GPIO/value)
#    echo "[✓] GPIO $GPIO exported and reads: $VALUE" >> "$LOG_FILE"
#done

echo "===== End of Hardware Check =====" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

rclone copy /home/TuxNode/boot_logs gdrive:TuxNode_Sync/Boot/
