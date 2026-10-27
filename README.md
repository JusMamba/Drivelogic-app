# DriveLogic Mobile App & AI Mechanic

A mobile application for automotive consulting, AI-driven vehicle diagnosis, and specialist shop recommendations. Built with **React Native (Expo)** and **Python (FastAPI)**.

---

## Architecture Overview

```
drivelogic-app/
├── backend/
│   ├── server.py               # FastAPI backend with AI Mechanic & OSM shop finder
│   ├── requirements.txt        # Backend dependencies
│   ├── .env                    # AI keys and server configuration
│   └── drivelogic.db           # SQLite database for diagnostic logs & bookings
└── frontend/
    ├── App.js                  # Complete mobile app with AI Mechanic, Shops & Consulting
    ├── package.json            # React Native & Expo dependencies
    ├── app.json                # Expo mobile configuration (iOS / Android)
    └── .env                    # EXPO_PUBLIC_BACKEND_URL
```

---

## Features

1. **AI Mechanic Diagnostic**:
   - Vehicle selector (Year, Make, Model, Mileage).
   - Instant symptom checker (brakes, check engine light, starting issues, overheating, transmission slipping).
   - Probable causes breakdown with likelihood rating.
   - Urgency & safety indicators (Safe to Drive vs. Stop Driving).
   - Repair cost range estimation.
   - Direct questions to ask the mechanic to avoid unnecessary upselling.
   - One-tap button to find specialized shops for the diagnosed problem.

2. **Specialist Shop Finder**:
   - Location-based repair shop search using OpenStreetMap.
   - Filtering by specialty (Brakes & Suspension, Transmission, Diagnostics, Electrical, Tires).
   - Ratings, reviews, distance calculation, phone contact, and verified badges.

3. **DriveLogic Vehicle Consulting**:
   - Information about independent consulting services.
   - Intake form for repair quote auditing and pre-purchase guidance.
   - Direct link to `drivelogic.org`.

---

## How to Run

### 1. Start the Backend API
```bash
cd backend
venv\Scripts\python -m uvicorn server:app --host 0.0.0.0 --port 8000 --reload
```
API Health Check: `http://localhost:8000/api/health`
Interactive Docs: `http://localhost:8000/docs`

### 2. Start the Mobile Frontend
```bash
cd frontend
npx expo start
```
- Press **w** to open in web browser.
- Scan the QR code using the **Expo Go** app on your physical iPhone or Android to run it natively on your phone.

---

## Enabling Live AI Models (Optional)

In `backend/.env`, add your API key when you have one:
```env
ANTHROPIC_API_KEY=sk-ant-...
# OR
OPENAI_API_KEY=sk-...
```
*Note: If no API key is set, the app automatically runs on its built-in automotive diagnostic engine with zero errors.*
