# 🐧 Penguin Monitoring System — User Interface

This repository folder contains the **User Interface (UI) subsystem** for the Penguin Monitoring System — a lightweight web application designed to display and manage real-time data from a penguin monitoring device deployed in the field.

## 📌 Overview

The user interface acts as the main point of interaction between researchers and the system. It provides real-time penguin data visualisation (e.g. weight, timestamp, image), historical tracking, and metadata input. The design prioritises simplicity, usability, and support for field conditions such as low bandwidth and limited connectivity.

## 📷 Features

- ✅ **Real-Time Data Streaming** (via Server-Sent Events)
- 📊 **Historical Weight Graphs** (Chart.js)
- 📅 **Penguin Detail Pages** with profile metadata
- 📝 **Metadata Management** (e.g., gender, molt stage)
- 🔍 **Search & Filter Tools**
- 📤 **Export Reports** (CSV, PDF, Excel)
- 💾 **LocalStorage Support** for session continuity

## 🌐 Technologies Used

| Layer        | Stack / Tools                         |
|--------------|----------------------------------------|
| Frontend     | HTML, CSS, JavaScript                  |
| Charting     | Chart.js                               |
| Backend API  | Flask (Python), SQLite (via Flask API) |
| Live Updates | Server-Sent Events (SSE)               |
| Deployment   | Can run locally or connect to backend server |

## 📂 Folder Structure
UserInterface/
├── Frontend/
│   ├── index.html               # Main dashboard page
|   ├── penguin-details.html     # Individual penguin profile page
|   ├── reports.html             # Data analytics and reporting page
│   ├── styles.css               # Main stylesheet
│   ├── penguin-details.css      # Main stylesheet
│   ├── reports.css              # Main stylesheet
│   ├── script.js                # Dashboard functionality
│   ├── penguin-details.js       # Penguin Details page functionality
│   └── reports.js               # Report page functionality
├── Backend/
│   └── main.py                  #Flask python code(API's)
└── README.md              # This file


## 🚀 Getting Started

### 1. Prerequisites

- Clone the full repository or just this `ui/` folder.
- Ensure your backend API is running on a server or locally (Flask app).
- Adjust `backendUrl` in JS files to match your backend (e.g., `http://localhost:5000` or hosted server).

### 2. Run the Interface Locally

You can serve the UI using any static web server (e.g. VS Code Live Server extension or Python's built-in HTTP server):

```bash```
#From inside the ui/ directory

python -m http.server 3000

### 3. Environment Configuration
Ensure all JavaScript files point to the correct backend URL:
      ...const backendUrl = "https://your-server-address/api";
.Update all instances of backendUrl in the JS files (dashboard.js, penguin-details.js, etc).

### 🤝 Contributions
.Contributions are welcome! Please open issues or pull requests to propose changes or improvements.

### Developed by Lithemba


