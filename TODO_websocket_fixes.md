# WebSocket 404 Error Fixes

## Root Cause Analysis
- **Issue**: Frontend attempting WebSocket connections to `/ws/queues/22/` resulting in 404 errors
- **Cause 1**: Port mismatch - Frontend uses port 8000 for WebSocket, but ASGI runs on port 8001
- **Cause 2**: Non-existent service points - Frontend tries to connect to service points that don't exist in database

## Fixes Implemented

### ✅ Configuration Updates
- [x] Updated `queueflow/frontend/src/config.js` to include separate WS_BASE_URL (ws://localhost:8001)
- [x] Added proper exports for both API_BASE_URL and WS_BASE_URL

### ✅ Frontend Component Updates
- [x] Updated `StaffDashboard.jsx` to import and use WS_BASE_URL
- [x] Updated `UserDashboard.jsx` to import and use WS_BASE_URL
- [x] Added validation in UserDashboard.jsx to only create WebSocket connections when service_point.id exists

### ✅ Backend Verification
- [x] Confirmed ASGI application runs on port 8001 (Procfile: `worker: daphne -b 0.0.0.0 -p 8001 queueflow.asgi:application`)
- [x] Verified WebSocket routing is properly configured in `routing.py`
- [x] Confirmed service point with ID 22 does not exist in database

## Testing Steps
- [ ] Start ASGI server on port 8001: `daphne -b 0.0.0.0 -p 8001 queueflow.asgi:application`
- [ ] Start Django server on port 8000: `python manage.py runserver 8000`
- [ ] Start React frontend: `npm start`
- [ ] Check browser console for WebSocket connection errors
- [ ] Verify WebSocket connections use correct port (8001)

## Expected Results
- No more 404 errors for `/ws/queues/{id}/` URLs
- WebSocket connections should establish successfully for existing service points
- Real-time queue updates should work properly

## Notes
- ASGI application must be running on port 8001 for WebSocket functionality
- Frontend now uses separate configuration for HTTP API (port 8000) and WebSocket (port 8001)
- Added validation to prevent WebSocket connections to non-existent service points
