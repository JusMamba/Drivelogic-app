# DriveLogic Mobile App - Project State & Architecture

## Repository & Deployments
- **GitHub Repository**: `https://github.com/JusMamba/Drivelogic-app.git` (branch `main`)
- **Live Frontend (Vercel)**: `https://drivelogic-app.vercel.app` (PWA / Home Screen app for iPhone & Android)
- **Live Backend (Render)**: `https://drivelogic-app.onrender.com` (FastAPI + AI Mechanic + OSM Shops API)
- **Local Workspace**: `C:\Users\e425569\drivelogic-app`

## Recent Fixes
1. **Accurate Diagnostic Engine**:
   - Expanded backend diagnostic coverage to all vehicle subsystems: A/C & heating (freon leaks, compressor, blend doors), suspension clunks (sway bars, struts, ball joints), steering & highway vibration (tire balance, radial separation, alignment), fluid leaks (oil burning, coolant, fuel, rotten egg sulfur), exhaust roar, hesitation/stalling, and OBD-II codes.
   - Dynamic prompt generation quoting the driver's exact words with specific technical triage.
2. **Native Text Input Reset**:
   - Added `inputRef` with native DOM and React Native clearing methods so text clears immediately on iOS Safari and mobile PWA when tapping Send.
3. **Conversational Multi-Turn Chat**:
   - Maintains full history across follow-up queries.
