# Quick Start Guide: Testing WebRTC Integration

## Prerequisites

✅ Node.js installed  
✅ Dependencies installed: `npm install`  
✅ Two browser windows/tabs for testing

## Test 1: Socket.io Only Mode (Backward Compatible)

This tests that the default mode works exactly as before.

```bash
# Start server WITHOUT WebRTC (default)
npm start
```

**Expected Console Output:**
```
Server listening on http://localhost:3000
WebRTC support NOT enabled (set ENABLE_WEBRTC=true to enable)
```

**Open Browser:**
1. Navigate to `http://localhost:3000`
2. Open DevTools → Console
3. Look for: `Protocol mode: socketio-only, WebRTC enabled: false`

✅ **Pass Criteria:** Game works normally, all features functional

---

## Test 2: WebRTC Hybrid Mode (New)

This tests the new dual-protocol architecture.

```bash
# Stop the server (Ctrl+C)

# Start server WITH WebRTC
ENABLE_WEBRTC=true npm start
```

**Expected Console Output:**
```
Server listening on http://localhost:3000
WebRTC support enabled via geckos.io
WebRTC server (geckos.io) listening on port 3001
```

**Open Browser:**
1. Navigate to `http://localhost:3000`
2. Open DevTools → Console
3. Look for:
   ```
   Socket.io connected: <socket-id>
   WebRTC connection established via geckos.io
   Protocol mode: hybrid, WebRTC enabled: true
   WebRTC channel established for socket <id>
   ```

4. Open DevTools → Network tab
5. Filter by "WS" (WebSocket)
6. You should see:
   - Socket.io connection (for critical events)
   - WebRTC connection (for high-frequency updates)

7. Start playing the game
8. In Console, you should NOT see Socket.io events for:
   - `refresh_player` 
   - `refresh_players`
   
   These are now sent via WebRTC binary!

✅ **Pass Criteria:** 
- WebRTC connection established
- High-frequency updates via WebRTC (not Socket.io)
- Game still fully playable

---

## Test 3: Graceful Fallback

This tests that WebRTC failure doesn't break the game.

### Scenario A: Server WebRTC Disabled

```bash
# Start with WebRTC disabled
ENABLE_WEBRTC=false npm start
```

**Browser Console:**
```
Socket.io connected: <id>
Protocol mode: socketio-only, WebRTC enabled: false
```

✅ **Pass:** Client detects server doesn't support WebRTC, uses Socket.io only

### Scenario B: Client WebRTC Unavailable

1. Start server with WebRTC enabled: `ENABLE_WEBRTC=true npm start`
2. Open browser in Incognito/Private mode
3. Manually disable WebRTC in browser:
   - Chrome: `chrome://flags/#enable-webrtc` → Disabled
   - Firefox: `about:config` → `media.peerconnection.enabled` → false

**Browser Console:**
```
WebRTC connection failed: <error>
Falling back to Socket.io only
Protocol mode: socketio-only
```

✅ **Pass:** Game works perfectly via Socket.io fallback

---

## Test 4: Performance Comparison

Compare latency and bandwidth between Socket.io and WebRTC.

### Setup
1. Start server: `ENABLE_WEBRTC=true npm start`
2. Open two browser tabs

### Tab 1: WebRTC Mode (Modern Client)
- DevTools → Network tab → WS filter
- Watch real-time messages
- Note: `refresh_player` and `refresh_players` NOT on Socket.io

### Tab 2: Socket.io Mode (Legacy Client)
- DevTools → Console
- Paste:
  ```javascript
  clientCapabilities.protocols.geckos = false;
  location.reload();
  ```
- This simulates an old client

### Compare
- **Message Count:** Tab 2 should show ~40 Socket.io messages/sec
- **Bandwidth:** Tab 1 uses ~85% less data (binary vs JSON)
- **Latency:** Move your player - WebRTC feels more responsive

✅ **Pass:** WebRTC shows measurable improvements

---

## Test 5: Mixed Room (Old + New Clients)

Tests that old and new clients can play together.

1. Start server: `ENABLE_WEBRTC=true npm start`
2. Open Tab 1: Modern browser (Chrome) → WebRTC mode
3. Open Tab 2: Simulate old client:
   ```javascript
   // In console BEFORE joining
   clientCapabilities.protocols.geckos = false;
   location.reload();
   ```
4. Join game in both tabs
5. Move both players

✅ **Pass Criteria:**
- Both players see each other
- Both can shoot and interact
- No errors in console
- Server logs show mixed protocols:
  ```
  Protocol selected: hybrid (Tab 1)
  Protocol selected: socketio-only (Tab 2)
  ```

---

## Debugging Tips

### Problem: "geckos is not defined"

**Cause:** geckos.io CDN script not loaded

**Fix:** Check [src/public/main.html](src/public/main.html) line ~194:
```html
<script src="https://unpkg.com/@geckos.io/client@3.0.2/lib/geckos.io.min.js"></script>
```

### Problem: "BinaryProtocol is not defined"

**Cause:** Script load order wrong

**Fix:** Ensure in [main.html](src/public/main.html):
```html
<script src="js/binary_protocol_client.js"></script>  <!-- BEFORE variables_mainpage.js -->
<script src="js/variables_mainpage.js"></script>
```

### Problem: WebRTC connects but no data received

**Cause:** Server not sending via WebRTC (check TransportManager)

**Debug:**
1. Server console: Look for "TransportManager initialized"
2. Check `ENABLE_WEBRTC` environment variable
3. Verify port 3001 not blocked

### Problem: Players invisible in WebRTC mode

**Cause:** Binary decoding failure

**Debug:**
1. Browser console: Check for decode errors
2. Verify [BinaryProtocol.js](src/utils/BinaryProtocol.js) encoding matches [binary_protocol_client.js](src/public/js/binary_protocol_client.js) decoding
3. Check byte alignment (all offsets correct)

---

## Success Checklist

- [ ] Test 1: Socket.io only mode works
- [ ] Test 2: WebRTC hybrid mode works
- [ ] Test 3: Graceful fallback works
- [ ] Test 4: Performance improvements visible
- [ ] Test 5: Mixed rooms work (old + new clients)
- [ ] No console errors in any mode
- [ ] All game features work in all modes

---

## Next: Production Deployment

Once all tests pass, see [WEBRTC_INTEGRATION.md](WEBRTC_INTEGRATION.md) for production rollout strategy.

**Recommended:**
1. Deploy with `ENABLE_WEBRTC=false` initially
2. Verify all existing features work
3. Enable on 10% of servers
4. Monitor for 1 week
5. Gradual rollout to 100%
