# 💧 AquaVision — Smart Water Monitoring System

AquaVision is an intelligent water-monitoring platform designed to help households and institutions understand, analyze, and reduce daily water consumption. By combining IoT devices, real-time processing, predictive analytics, and gamification, AquaVision transforms raw sensor data into actionable insights.

This project was developed as a final engineering project, integrating hardware, backend, frontend, data processing, and UX into a complete working prototype.

---

## 🌍 Problem Statement

Most households lack real-time visibility into how water is consumed.  
Traditional water meters only show cumulative usage, making it impossible to identify leaks, inefficiencies, or wasteful routines.

**Without data, there is no awareness — and without awareness, there is no improvement.**

AquaVision solves this by offering:

- Real-time consumption monitoring  
- Sector-based breakdown (kitchen, bathroom, patio, etc.)  
- Predictive consumption models  
- Smart alerts and notifications  
- Gamification elements to encourage habit change  

---

## 🎯 Main Objectives

- Monitor household water consumption in real time  
- Detect abnormal usage and potential leaks  
- Predict future consumption and cost estimation  
- Encourage sustainable habits through gamification  
- Provide exportable data for institutions and providers  
- Enable future Smart City integrations  

---

## 🔧 System Architecture

AquaVision is composed of four main layers:

### **Hardware Layer**
- Flow meter (caudalímetro)  
- ESP32 microcontroller  
- Wi-Fi communication  

### **Communication Layer**
- HTTP/MQTT device-to-server communication  
- Continuous transmission of flow data  

### **Backend Layer**
- **Spring Boot**  
- Authentication, processing, predictions, and storage  
- Exposes REST API  

### **Frontend Layer**
- **Angular**  
- Dashboards, reports, notifications, gamification  
- Responsive and intuitive UI  

📌 *Suggested Screenshot:*  
*Architecture diagram showing Sensor → Backend → Database → Frontend*

---

## 🖥️ Features Overview

### ✅ Real-Time Monitoring
Track consumption by hour, day, month, and per household sector.  
📌 *Suggested Screenshot:* Real-time dashboard comparing today's usage vs yesterday.

---

### ✅ Daily & Historical Reports
Generate detailed graphs by date range and sector, including cost estimation.  
📌 *Suggested Screenshot:* Sector breakdown & costs.

---

### ✅ Activity Tracking
Register activities (shower, washing dishes, washing car, etc.) and correlate them with consumption peaks.  
📌 *Suggested Screenshot:* Activities timeline view.

---

### ✅ Smart Notifications
Receive alerts for:

- Abnormal consumption  
- Possible leak  
- Predicted usage threshold exceeded  
- Device disconnected  
- Daily gamification reminders  

📌 *Suggested Screenshot:* Notifications panel.

---

### ✅ Predictive Analysis
Uses historical data to forecast future consumption.

Displays:
- Current usage  
- Predicted trend  
- Min/Max estimation  

📌 *Suggested Screenshot:* Prediction graph.

---

### ✅ Gamification System
Encourages sustainable water behavior through:

- Conservation quizzes  
- Daily/weekly challenges  
- Streaks & achievements  
- Points and rankings  

📌 *Suggested Screenshot:* Gamification page with trivia & points.

---

### ✅ Admin Panel
For institutions and water providers:

- Global system metrics  
- Anonymous aggregated data  
- Exportable reports (PDF/Excel)  
- Locality-based analysis  

📌 *Suggested Screenshot:* Admin dashboard.

---

## 🧪 Validation & Testing

The system was validated in controlled environments using simulated and real water flow (aquarium + flow sensor).

**Tests performed:**
- Functional testing  
- Integration testing (Sensor → API → UI)  
- Load & concurrency simulations  
- Manual behavioral validation  

**Outcome:**  
High accuracy in detecting consumption patterns and anomalies.

---

## 🛠️ Technologies Used

### **Backend**
- Java  
- Spring Boot  
- REST API  
- JWT Security  
- MySQL  

### **Frontend**
- Angular  
- TypeScript  
- Chart.js / ApexCharts  
- Bootstrap / Tailwind CSS  

### **Hardware**
- ESP32  
- Flow Sensor  
- Wi-Fi Module  

### **Other Tools**
- Git / GitHub  
- Postman  
- Canva / Figma  
- Power BI (optional reporting)

---

## 🚀 How to Run the Application

Run the full system (backend, frontend, and database setup) with:

```bash
./start.sh

Before running, configure environment variables inside start.sh:

# Database configuration
DB_NAME="notesdb"
DB_USER="root"
DB_PASS="123456"
DB_HOST="localhost"
DB_PORT="3306"

BACKEND_DIR="./backend"
FRONTEND_DIR="./frontend"

# Adjust according to your system
MYSQL_CMD="/c/Program Files/MySQL/MySQL Server 8.0/bin/mysql.exe"

The script will:

Create/verify database

Export backend variables

Launch Spring Boot API

Install & start Angular frontend

🔐 Default Credentials
Username: aquavision
Password: test123


(Only for demo/testing purposes)
