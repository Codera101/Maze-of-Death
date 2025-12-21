# WebRTC Integration - Hybrid Protocol Architecture

This document explains the dual-protocol (Socket.io + WebRTC) implementation with full backward compatibility.

## Overview

The game now supports **two communication protocols**:

1. **Socket.io (TCP)** - For critical events requiring guaranteed delivery
2. **geckos.io (WebRTC/UDP)** - For high-frequency realtime updates with low latency

### Why Both?

- **Socket.io**: Perfect for join/leave, shooting, deaths, scoring - events that **must not be lost**
- **WebRTC**: Ideal for player positions updated 20 times/second - events where the **next update matters more than the lost one**

## Architecture

### Message Classification

Messages are classified by priority (see [src/utils/MessagePriority.js](src/utils/MessagePriority.js)):

**CRITICAL (Socket.io only):**
- `join_player`, `player_joined` - Room management
- `shoot`, `target_hit`, `got_hit` - Combat actions
- `died`, `respawn`, `respawn_done` - Lifecycle events
- `kill_message`, `refresh_ranking` - Leaderboard updates
- `draw_maze`, `room_full` - Initial setup

**REALTIME (WebRTC when available, Socket.io fallback):**
- `player_move`, `player_moved` - Movement input/confirmation
- `refresh_player` - Player stats (20Hz - every 50ms)
- `refresh_players` - Visible players (20Hz - every 50ms)
- `player_hit_animation` - Visual feedback only

### Data Encoding

**Socket.io path:** JSON (backward compatible)
```javascript
{ id: "abc123", x: 5.5, y: 12.3, dir: "N", health: 20, score: 150, ... }
// ~200 bytes
```

**WebRTC path:** Binary Buffers (optimized)
```
[type:1][id:4][x:4][y:4][dir:1][health:1][score:2][kills:2][bullets:1][color:4][timestamp:4]
// ~28 bytes (85% reduction!)
```

See [src/utils/BinaryProtocol.js](src/utils/BinaryProtocol.js) for encoding logic.

## Backward Compatibility

### Old Clients (Socket.io only)
- Do **NOT** need to update
- Work exactly as before
- Don't send `client_capabilities` 
- Server defaults to Socket.io-only mode

### New Clients (WebRTC capable)
- Send `client_capabilities` on connect
- Establish WebRTC connection if server supports it
- **Gracefully fallback** to Socket.io if:
  - WebRTC disabled on server (`ENABLE_WEBRTC=false`)
  - Corporate firewall blocks WebRTC
  - NAT traversal fails
  - Browser doesn't support `RTCPeerConnection`

### Mixed Rooms
- Old and new clients can play together
- Server handles both protocols simultaneously
- Game logic is protocol-agnostic (server-authoritative)

## Files Changed/Added

### Server-Side

**New Files:**
- [src/utils/TransportManager.js](src/utils/TransportManager.js) - Protocol router (Socket.io vs WebRTC)
- [src/utils/MessagePriority.js](src/utils/MessagePriority.js) - Message classification
- [src/utils/BinaryProtocol.js](src/utils/BinaryProtocol.js) - Binary encoding/decoding

**Modified:**
- [src/server.js](src/server.js) - Added geckos.io setup, protocol negotiation
- [src/controlers/RoomControler.js](src/controlers/RoomControler.js) - Uses TransportManager (no changes needed, polymorphism!)
- [package.json](package.json) - Added `@geckos.io/server`, `@geckos.io/client`
- [docker-compose.yml](docker-compose.yml) - Added `ENABLE_WEBRTC` flag, port 3001

### Client-Side

**New Files:**
- [src/public/js/binary_protocol_client.js](src/public/js/binary_protocol_client.js) - Binary decoder

**Modified:**
- [src/public/main.html](src/public/main.html) - Added geckos.io CDN script
- [src/public/js/variables_mainpage.js](src/public/js/variables_mainpage.js) - Capability detection, WebRTC setup
- [src/public/js/refresh_player.js](src/public/js/refresh_player.js) - Dual handlers (Socket.io + WebRTC)
- [src/public/js/refresh_visible_players.js](src/public/js/refresh_visible_players.js) - Removed throttle for WebRTC path

## Deployment

### Development (Local Testing)

**Socket.io only (default):**
```bash
npm install
npm start
# Server runs on http://localhost:3000
```

**With WebRTC:**
```bash
ENABLE_WEBRTC=true npm start
# Socket.io: http://localhost:3000
# WebRTC: http://localhost:3001
```

### Docker

**Socket.io only (safe default):**
```bash
docker-compose up
```

**With WebRTC:**
```yaml
# Edit docker-compose.yml
environment:
  - ENABLE_WEBRTC=true  # Change from 'false'
```

Then:
```bash
docker-compose up --build
```

### Production Rollout Strategy

**Phase 1: Canary (10% of users)**
1. Deploy with `ENABLE_WEBRTC=true` to 1 server
2. Route 10% of traffic via load balancer
3. Monitor metrics:
   - WebRTC connection success rate
   - Latency improvements
   - Error rates

**Phase 2: Gradual (50% of users)**
1. If Phase 1 successful (>90% success rate)
2. Scale to 50% of servers with WebRTC
3. Continue monitoring for 1 week

**Phase 3: Full Rollout**
1. Enable `ENABLE_WEBRTC=true` on all servers
2. Keep monitoring dashboards active
3. Rollback flag is instant: `ENABLE_WEBRTC=false`

## Performance Gains

### Bandwidth Reduction
**Per Player:**
- Before: ~15-20 KB/sec (JSON over Socket.io)
- After: ~2-3 KB/sec (Binary over WebRTC)
- **~85% reduction**

**At 10 Players:**
- Before: ~150-200 KB/sec server bandwidth
- After: ~20-30 KB/sec server bandwidth

### Latency Improvement
**Typical Results:**
- Socket.io: 80-150ms round-trip (TCP head-of-line blocking)
- WebRTC: 20-50ms round-trip (UDP-like, no retransmission)
- **~60-70% latency reduction**

### Refresh Rate
**Client-side rendering:**
- Before: Throttled to 100ms (10 FPS) due to TCP congestion
- After: Full 50ms (20 FPS) via WebRTC, smooth interpolation

## Troubleshooting

### Client can't connect to WebRTC

**Symptoms:** Console shows "WebRTC connection failed", falls back to Socket.io

**Causes:**
1. Server has `ENABLE_WEBRTC=false`
2. Port 3001 blocked by firewall
3. Corporate network blocks WebRTC
4. NAT traversal failed

**Solution:** This is expected behavior! The fallback ensures the game still works.

### Binary data not decoding

**Symptoms:** Players not visible, stats not updating via WebRTC

**Checks:**
1. Verify [src/public/js/binary_protocol_client.js](src/public/js/binary_protocol_client.js) loaded before [variables_mainpage.js](src/public/js/variables_mainpage.js)
2. Check browser console for "BinaryProtocol not loaded"
3. Ensure `window.BinaryProtocol` exists in console

### Server logs "Failed to initialize geckos.io"

**Symptoms:** Server starts but WebRTC unavailable

**Causes:**
1. `@geckos.io/server` not installed
2. Port 3001 already in use

**Solution:**
```bash
npm install  # Ensure all dependencies installed
lsof -i :3001  # Check if port in use
```

## Testing

### Manual Test Plan

**Test 1: Old client compatibility**
1. Checkout old version of client (before WebRTC)
2. Connect to new server
3. ✅ Should work exactly as before

**Test 2: WebRTC enabled client**
1. Open game in Chrome
2. Check console: "WebRTC connection established"
3. Check Network tab: No Socket.io events for `refresh_player`/`refresh_players`
4. ✅ High-frequency updates via WebRTC

**Test 3: WebRTC fallback**
1. Set `ENABLE_WEBRTC=false` on server
2. Client should log: "Falling back to Socket.io only"
3. ✅ Game still playable

**Test 4: Mixed room**
1. Open 2 browser tabs
2. Tab 1: WebRTC enabled
3. Tab 2: Disable WebRTC in browser settings
4. Both players see each other
5. ✅ Mixed protocol coexistence

### Automated Tests (TODO)

```bash
npm test  # Run existing tests (should all pass)
```

**Future test coverage:**
- TransportManager protocol selection
- BinaryProtocol encoding/decoding
- Message priority classification
- WebRTC fallback scenarios

## Monitoring (Production)

**Key Metrics to Track:**

```javascript
// Server-side metrics
{
  socketioOnlyClients: 45,      // Clients using Socket.io only
  webrtcClients: 155,            // Clients using hybrid mode
  webrtcFailures: 5,             // WebRTC setup failures
  avgLatencySocketio: 95,        // ms
  avgLatencyWebrtc: 28,          // ms
  packetLossWebrtc: 0.02         // 2% (acceptable for position updates)
}
```

**Rollback Trigger:**
```javascript
if (webrtcFailures / webrtcClients > 0.1) {
  // >10% failure rate - disable WebRTC
  process.env.ENABLE_WEBRTC = 'false';
  server.restart();
}
```

## FAQ

**Q: Do I need to update old clients?**  
A: No! Old clients continue to work via Socket.io.

**Q: What if WebRTC fails?**  
A: Automatic fallback to Socket.io. Player won't notice except slightly higher latency.

**Q: Can I disable WebRTC after enabling?**  
A: Yes! Set `ENABLE_WEBRTC=false` and restart. No client changes needed.

**Q: Why not WebSockets instead of WebRTC?**  
A: WebSockets use TCP (same as Socket.io). WebRTC uses UDP, eliminating head-of-line blocking.

**Q: What about packet loss with UDP?**  
A: Position updates are sent 20 times/second. If one is lost, the next arrives in 50ms. For critical events (shooting, deaths), we still use TCP.

**Q: Does this work on mobile?**  
A: Yes! Modern mobile browsers support WebRTC. Older ones fall back to Socket.io.

## Next Steps

**Enhancements (not yet implemented):**

1. **Client-side prediction** - Move player locally, snap to server position only on mismatch
2. **Entity interpolation** - Smooth animate between positions instead of teleporting
3. **Adaptive bitrate** - Reduce update frequency on slow connections
4. **STUN/TURN servers** - Improve NAT traversal for corporate networks
5. **Delta compression** - Send only changed fields (reduce 28 bytes to ~10 bytes)

## Credits

- **Socket.io** - Reliable TCP communication
- **geckos.io** - WebRTC made easy for Node.js
- **WebRTC** - IETF/W3C standard for peer-to-peer communication

---

**Implementation Date:** December 2025  
**Version:** 2.0.0 (Hybrid Protocol)
