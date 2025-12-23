# Geckos.io Integration Verification

## Files Using Geckos

### Player Mode
- `src/public/main.html` - Loads geckos from CDN
- `src/public/js/variables_mainpage.js` - Initializes geckos connection
- `src/public/js/refresh_player.js` - Handles webrtc_refresh_player events
- `src/public/js/refresh_visible_players.js` - Handles webrtc_refresh_players events

### Viewer Mode
- `src/public/viewer_main.html` - Loads geckos from local file
- `src/public/js/variables_mainpage.js` - Shared initialization
- `src/public/js/viewer_draw.js` - Handles webrtc_refresh_players events

### Server Side
- `src/server.js` - Geckos server setup, channel management
- `src/utils/TransportManager.js` - Routes messages via WebRTC when available
- `src/utils/BinaryProtocol.js` - Encodes/decodes binary messages

## Quick Test

1. Start server with WebRTC enabled:
   ```bash
   ENABLE_WEBRTC=true npm start
   ```

2. Open browser console and navigate to:
   - Player: http://localhost:3000/game
   - Viewer: http://localhost:3000/view

3. Check console for:
   ```
   [WebRTC] geckos.io loaded successfully
   [WebRTC] Initializing geckos.io...
   WebRTC connection established via geckos.io
   Protocol mode: hybrid, WebRTC enabled: true
   ```

## Current Status: ✅ READY

Both player and viewer modes are configured to use geckos.io WebRTC.
Just set ENABLE_WEBRTC=true to activate!
