# DriveLogic Mobile App - Project State & Architecture

## Repository & Deployments
- **GitHub Repository**: `https://github.com/JusMamba/Drivelogic-app.git` (branch `main`)
- **Live Frontend (Vercel)**: `https://drivelogic-app.vercel.app` (PWA / Home Screen app for iPhone & Android)
- **Live Backend (Render)**: `https://drivelogic-app.onrender.com` (FastAPI + AI Mechanic + OSM Shops API)
- **Local Workspace**: `C:\Users\e425569\drivelogic-app`

## Key Architecture & Features
- **Frontend (`frontend/App.js`)**:
  - React Native / Expo with dark-mode styling.
  - **AI Mechanic**: Interactive chat & quick symptoms, photo attachment & visual inspection, safety urgency badges, cost estimates, mechanic questions.
  - **DIY Parts Sourcing**: Direct search links to RockAuto, FCP Euro (auto-recommended for European makes), AutoZone, Advance Auto Parts.
  - **Specialist Shops Network**: OpenStreetMap proximity search with ratings, review counts, and filter by specialty.
  - **Consulting**: DriveLogic intake booking and links to `drivelogic.org`.
- **Backend (`backend/server.py`)**:
  - `/api/diagnose`: Multi-mode automotive diagnostic engine (built-in rule engine + Anthropic Claude / OpenAI when keys are supplied).
  - `/api/shops/nearby`: Overpass API car repair lookup with Haversine distance.
  - `/api/consulting/book`: SQLite database persistence for consultation leads.
  - `/api/health` & `/`: Health & status routes.

## Fast Iteration Workflow
- Any changes made locally in `frontend/` or `backend/` are committed and pushed to `origin main`.
- Vercel and Render automatically re-deploy in ~45-60 seconds with zero manual steps.
