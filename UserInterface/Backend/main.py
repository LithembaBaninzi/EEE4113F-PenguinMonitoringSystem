from flask import Flask, jsonify, Response, request, send_from_directory
from flask_cors import CORS
import os
import json
from datetime import datetime
from threading import Lock
import mysql.connector  # Import the mysql.connector module
import logging

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

clients = []
lock = Lock()


# --- MySQL Database Setup ---
def get_db_connection():
    return mysql.connector.connect(host=********,
                                   user=********,
                                   password=********,
                                   database=********,
                                   port=****)


def get_db_connection():
return mysql.connector.connect(**db_config)
return mysql.connector.connect
try:
conn = get_db_connection()
print(" Connected to database!")
conn.close()
except Exception as e:
print(f" Connection failed: {e}")

# --- Persistent Penguin ID (can be updated via internal API) ---
CURRENT_PENGUIN_ID = {"value": "PNG-001"}

# --- Routes ---


@app.route('/penguin', methods=['POST'])
def handle_post():
    global latest_data
    
    if 'metadata' not in request.form:
        return jsonify({"error": "Metadata not received"}), 400

    metadata_json = request.form['metadata']
    metadata = json.loads(metadata_json)
    
    # Handle image with fallback to default
    image_url = "/static/default_penguin.jpg"  # Default placeholder
    
    if 'image' in request.files and request.files['image'].filename != '':
        image = request.files['image']
        # Save image with timestamped filename
        timestamp = datetime.now().strftime('%Y%m%d-%H%M%S')
        penguin_id = CURRENT_PENGUIN_ID["value"]
        filename = f"{penguin_id}_{timestamp}.jpg"
        image_path = os.path.join(UPLOAD_FOLDER, filename)
        image.save(image_path)
        image_url = f"/uploads/{filename}"

    # Prepare data
    data = {
        "id": CURRENT_PENGUIN_ID["value"],
        "weight": float(metadata.get("weight")),
        "date": metadata.get("date"),
        "time": metadata.get("time"),
        "imageUrl": image_url
    }

    # Save to database
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
     """
      INSERT INTO penguin_measurements (penguin_id, weight, date, time, image_url)
      VALUES (%s, %s, %s, %s, %s)
     """, (data["id"], data["weight"], data["date"], data["time"], data["imageUrl"]))
    conn.commit()
    cursor.close()
    conn.close()

    # Push to clients(frontend))
    with lock:
        for queue in clients:
            queue.put(json.dumps(data))

    return jsonify({
        "message": "Data received",
        "date": data["date"],
        "time": data["time"]
    }), 200


# Get 3 recent measurements for a penguin
@app.route("/api/penguin/<penguin_id>/recent", methods=["GET"])
def get_recent_penguin_measurements(penguin_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute(
            """
            SELECT weight, date, time
            FROM penguin_measurements
            WHERE penguin_id = %s
            ORDER BY date DESC, time DESC
            LIMIT 3
        """, (penguin_id, ))
        results = cursor.fetchall()

        if not results:
            return jsonify({"error": "Penguin not found"}), 404

        # Build list of dicts safely
        processed_results = []
        for row in results:
            weight_val = float(row[0])  # Ensure it's a float
            date_val = str(row[1])  # Ensure it's a string (from date)
            time_val = str(row[2])  # Ensure it's a string (from time)

            processed_results.append({
                "weight": weight_val,
                "date": date_val,
                "time": time_val,
            })

        cursor.close()
        conn.close()
        return jsonify(processed_results)

    except Exception as e:
        app.logger.error(f"Database error: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


# Get the latest 10 measurements across all penguins
@app.route("/api/latest-global-measurements", methods=["GET"])
def get_latest_global_measurements():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Query to get the latest 10 measurements across all penguins
        cursor.execute("""
            SELECT penguin_id, weight, date, time 
            FROM penguin_measurements 
            ORDER BY date DESC, time DESC 
            LIMIT 10
        """)

        results = cursor.fetchall()
        if not results:
            return jsonify([]), 200  # Return empty array if no results

        # Process results following the established pattern
        processed_results = []
        for row in results:
            penguin_id_val = str(row[0])  # Ensure it's a string
            weight_val = float(row[1])  # Ensure it's a float
            date_val = str(row[2])  # Ensure it's a string (from date)
            time_val = str(row[3])  # Ensure it's a string (from time)

            processed_results.append({
                "id": penguin_id_val,
                "weight": weight_val,
                "date": date_val,
                "time": time_val,
            })

        cursor.close()
        conn.close()
        return jsonify(processed_results)

    except Exception as e:
        # Log the error for server-side debugging
        print(f"Error fetching global measurements: {str(e)}")

        # Return a user-friendly error
        return jsonify({"error": "Failed to fetch recent measurements"}), 500


# Get recent measurements for a specific penguin
@app.route("/api/penguin/<penguin_id>/specific", methods=["GET"])
def get_penguin_details(penguin_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    # Query metadata
    cursor.execute(
        """
        SELECT field_name, field_value
        FROM penguin_metadata
        WHERE penguin_id = %s
    """, (penguin_id, ))
    metadata_rows = cursor.fetchall()


    # Process metadata results
    metadata = []
    for row in metadata_rows:
        field_name_val = str(row[0])
        field_value_val = str(row[1])
        metadata.append({
            "field_name": field_name_val,
            "field_value": field_value_val
        })

    # Query last 10 weight measurements
    cursor.execute(
        """
        SELECT weight, date, time, image_url
        FROM penguin_measurements
        WHERE penguin_id = %s
        ORDER BY date DESC, time DESC
        LIMIT 10
    """, (penguin_id, ))
    measurement_rows = cursor.fetchall()

    # Check if there are any measurements
    if not measurement_rows:
        return jsonify([]), 200  # Return empty array if no results

    # Process results following the established pattern
    measurements = []
    for row in measurement_rows:
        weight_val = float(row[0])
        date_val = str(row[1])
        time_val = str(row[2])
        image_url_val = str(row[3])
        measurements.append({
            "weight": weight_val,
            "date": date_val,
            "time": time_val,
            "image_url": image_url_val
        })

    cursor.close()
    conn.close()

    # Return both metadata and measurements
    return jsonify({"metadata": metadata, "measurements": measurements})


# Search for penguins by ID
@app.route("/api/penguin/search", methods=["GET"])
def search_penguin():
    try:
        query = request.args.get("q", "").strip()

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT DISTINCT penguin_id
            FROM penguin_measurements
            WHERE penguin_id LIKE %s
            LIMIT 10
        """, (f"%{query}%", ))
        penguin_ids = cursor.fetchall()
        results = []

        for row in penguin_ids:
            results.append({"id": row[0]})

        cursor.close()
        conn.close()
        return jsonify(results)
    except Exception as e:
        print(f"Error searching penguins: {str(e)}")
        return jsonify({"error": "Failed to search penguins"}), 500


# Add a custom field to a penguin's metadata
@app.route("/api/penguin/<penguin_id>/metadata", methods=["POST"])
def add_penguin_metadata(penguin_id):
    data = request.get_json()
    field_name = data.get("field_name")
    field_value = data.get("field_value")

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        INSERT INTO penguin_metadata (penguin_id, field_name, field_value)
        VALUES (%s, %s, %s)
    """, (penguin_id, field_name, field_value))

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"status": "success"}), 201

# --- Reports Page ---
#Report table route
@app.route("/reports/table", methods=["GET"])
def get_report_table():
    try:
        filter_option = request.args.get("filter", "id")

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Subquery: Latest measurement per penguin
        base_query = """
            SELECT m1.penguin_id,
                   m1.date AS last_seen,
                   m1.time,
                   m1.weight AS current_weight,
                   (
                       SELECT ROUND(AVG(m2.weight), 2)
                       FROM penguin_measurements m2
                       WHERE m2.penguin_id = m1.penguin_id
                         AND m2.date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
                   ) AS avg_weight_7d,
                   CASE
                       WHEN m1.weight < 4.0 THEN 'underweight'
                       WHEN m1.weight > 6.0 THEN 'overweight'
                       ELSE 'normal'
                   END AS status,
                   (
                       SELECT GROUP_CONCAT(CONCAT(field_name, ': ', field_value) SEPARATOR ', ')
                       FROM penguin_metadata
                       WHERE penguin_metadata.penguin_id = m1.penguin_id
                   ) AS comments
            FROM penguin_measurements m1
            INNER JOIN (
                SELECT penguin_id, MAX(date) AS max_date
                FROM penguin_measurements
                GROUP BY penguin_id
            ) latest ON m1.penguin_id = latest.penguin_id AND m1.date = latest.max_date
        """

        if filter_option == "underweight":
            base_query += " HAVING status = 'underweight'"
        elif filter_option == "overweight":
            base_query += " HAVING status = 'overweight'"
        elif filter_option == "normal":
            base_query += " HAVING status = 'normal'"

        base_query += " ORDER BY last_seen DESC"

        cursor.execute(base_query)
        results = cursor.fetchall()

        cursor.close()
        conn.close()

        return jsonify(results)

    except Exception as e:
        print(f"Report table error: {e}")
        return jsonify({"error": "Failed to fetch table data"}), 500


#Stats Summary route
@app.route("/reports/summary", methods=["GET"])
def get_report_summary():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Total distinct penguins
        cursor.execute(
            "SELECT COUNT(DISTINCT penguin_id) FROM penguin_measurements")
        total_penguins = cursor.fetchone()[0]

        # Average weight in the last 7 days
        cursor.execute("""
            SELECT AVG(weight)
            FROM penguin_measurements
            WHERE date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        """)
        avg_weight = round(cursor.fetchone()[0] or 0, 2)

        # Heaviest penguin
        cursor.execute("""
            SELECT penguin_id, MAX(weight) 
            FROM penguin_measurements
        """)
        heaviest = cursor.fetchone()
        heaviest_penguin = {
            "id": heaviest[0],
            "weight": heaviest[1]
        } if heaviest[0] else {}

        # Lightest penguin
        cursor.execute("""
            SELECT penguin_id, MIN(weight) 
            FROM penguin_measurements
        """)
        lightest = cursor.fetchone()
        lightest_penguin = {
            "id": lightest[0],
            "weight": lightest[1]
        } if lightest[0] else {}

        cursor.close()
        conn.close()

        return jsonify({
            "total_penguins": total_penguins,
            "avg_weight_7d": avg_weight,
            "heaviest": heaviest_penguin,
            "lightest": lightest_penguin
        })

    except Exception as e:
        print(f"Summary report error: {e}")
        return jsonify({"error": "Failed to fetch summary stats"}), 500


# --- Internal API to Update Penguin ID ---
@app.route('/update-penguin-id', methods=['POST'])
def update_penguin_id():
    body = request.get_json()
    new_id = body.get("id")
    if not new_id:
        return jsonify({"error": "Missing 'id' in request"}), 400
    CURRENT_PENGUIN_ID["value"] = new_id
    return jsonify({"message": f"Penguin ID updated to {new_id}"}), 200


# --- Event Stream Route ---
@app.route('/stream')
def stream():

    def event_stream(queue):
        while True:
            data = queue.get()
            yield f"data: {data}\n\n"

    from queue import Queue
    q = Queue()
    with lock:
        clients.append(q)
    return Response(event_stream(q), mimetype="text/event-stream")


# --- Serve Uploaded Images ---
@app.route("/uploads/<filename>")
def serve_image(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=81)
