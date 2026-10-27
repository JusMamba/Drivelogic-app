# DriveLogic Mobile App - Project State & Handover Notes

## Current State Summary
- **Project Directory**: `C:\Users\e425569\drivelogic-app`
- **Git Status**: Initialized on branch `main` with initial commit (`07a6d77`). Clean working tree with `.gitignore` protecting secrets.
- **Backend**: FastAPI (`backend/server.py`) with AI Mechanic diagnostics, vehicle consultation intake, OpenStreetMap specialist locator, and dynamic DIY parts sourcing (RockAuto, FCP Euro, AutoZone, Advance Auto).
- **Frontend**: React Native / Expo (`frontend/App.js`) supporting mobile (iOS / Android) and web (PWA). Includes photo attachment & visual inspection, specialist directory, and consultation booking.
- **Cloud Configs**: `render.yaml` (Backend) and `frontend/vercel.json` (Frontend) are pre-configured.

## Local Running Services
- **Backend**: Port 8000 (`http://localhost:8000/api/health`)
  - Run command: `cd backend && venv\Scripts\python -m uvicorn server:app --host 0.0.0.0 --port 8000 --reload`
- **Frontend Web**: Port 8081 (`http://localhost:8081`)
  - Build command: `cd frontend && npx expo export -p web`
  - Serve command: `cd frontend/dist && python -m http.server 8081`

## Next Steps Upon Return
1. User provides GitHub repository URL.
2. Push local commits to GitHub (`git remote add origin <url> && git push -u origin main`).
3. Deploy backend on Render (or Railway) and frontend on Vercel / GitHub Pages.
4. Set up public HTTPS URL so user's iPhone can open and install the app to Home Screen from outside the corporate network.
