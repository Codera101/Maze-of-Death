window.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    socket.emit("shoot");
  }
});

let laserSound = new Audio("../sounds/laserShoot.wav");
laserSound.volume = 0.1;
let laserHitWallSound = new Audio("../sounds/laserHitWall.wav");
let laserHitPlayerSound = new Audio("../sounds/laserHitPlayer.wav");
let laserKillPlayerSound = new Audio("../sounds/killPlayer.wav");

// Mobile Shoot Control
const setupMobileShoot = () => {
  const btnShoot = document.getElementById("btn-shoot");
  if (btnShoot) {
    const handleShoot = (e) => {
      e.preventDefault();
      e.stopPropagation(); // Prevent bubbling to window click listener
      socket.emit("shoot");
    };

    btnShoot.addEventListener("touchstart", handleShoot, { passive: false });
    btnShoot.addEventListener("click", handleShoot);
  }
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", setupMobileShoot);
} else {
  setupMobileShoot();
}

socket.on("target_hit", (data) => {
  laserSound.play();
  // laserSound.play();
  const {
    status,
    resultType,
    direction,
    targetX,
    targetY,
    targetId,
    targetName,
  } = data;

  if (status === true) {
    if (resultType === "kill") {
      laserHitPlayerSound.play();
      laserKillPlayerSound.play();
    } else if (resultType === "Hit") {
      laserHitPlayerSound.play();
    } else {
      laserHitWallSound.play();
    }
  }

  if (
    status === true &&
    typeof app !== "undefined" &&
    typeof myPlayer !== "undefined"
  ) {
    // Calculate laser beam coordinates
    const gridStep = cellSize + strokeWidth * 2;
    const shooterGridX = myPlayer.y * gridStep;
    const shooterGridY = myPlayer.x * gridStep;
    const shooterVisualX = shooterGridX + strokeWidth;
    const shooterVisualY = shooterGridY + strokeWidth;
    const shooterVisualWidth = cellSize - strokeWidth;

    const startX = shooterVisualX + shooterVisualWidth / 2;
    const startY = shooterVisualY + shooterVisualWidth / 2;

    let endX = startX;
    let endY = startY;

    // Calculate end position based on direction
    const dir =
      typeof direction === "string" ? direction.toUpperCase() : direction;

    // If hit a player, end laser at their position
    if (
      (resultType === "Hit" || resultType === "kill") &&
      targetX !== undefined &&
      targetY !== undefined
    ) {
      const targetGridX = targetY * gridStep;
      const targetGridY = targetX * gridStep;
      endX = targetGridX + strokeWidth + shooterVisualWidth / 2;
      endY = targetGridY + strokeWidth + shooterVisualWidth / 2;
    } else {
      // Hit wall or nothing - find where the wall is or use max range
      // Trace from shooter position to find the wall
      let currentX = myPlayer.x;
      let currentY = myPlayer.y;
      let distance = 0;
      const maxDistance = 20; // Max cells to check

      // Move step by step in the direction until we hit a wall or max distance
      while (distance < maxDistance) {
        // Move one step
        if (dir === "U") currentX--;
        else if (dir === "D") currentX++;
        else if (dir === "L") currentY--;
        else if (dir === "R") currentY++;

        distance++;

        // Check if out of bounds or hit a wall
        if (
          typeof mazeLayout !== "undefined" &&
          currentX >= 0 &&
          currentX < mazeLayout.length &&
          currentY >= 0 &&
          currentY < mazeLayout[0].length
        ) {
          if (mazeLayout[currentX][currentY] === 1) {
            // Hit a wall - end laser at wall edge
            const wallGridX = currentY * gridStep;
            const wallGridY = currentX * gridStep;
            endX = wallGridX + strokeWidth + shooterVisualWidth / 2;
            endY = wallGridY + strokeWidth + shooterVisualWidth / 2;
            break;
          }
        } else {
          // Out of bounds - end at edge
          const edgeGridX = currentY * gridStep;
          const edgeGridY = currentX * gridStep;
          endX = edgeGridX + strokeWidth + shooterVisualWidth / 2;
          endY = edgeGridY + strokeWidth + shooterVisualWidth / 2;
          break;
        }
      }

      // If no wall found, use the final position
      if (endX === startX && endY === startY) {
        const finalGridX = currentY * gridStep;
        const finalGridY = currentX * gridStep;
        endX = finalGridX + strokeWidth + shooterVisualWidth / 2;
        endY = finalGridY + strokeWidth + shooterVisualWidth / 2;
      }
    }

    // Draw laser beam
    if (typeof fireLaser === "function") {
      fireLaser(app, {
        xStart: startX,
        yStart: startY,
        xEnd: endX,
        yEnd: endY,
        lineWidth: 3,
      });
    }

    // Always show muzzle flash/spark effect when shooting
    if (typeof showWallImpact === "function") {
      showWallImpact(app, myPlayer.x, myPlayer.y, direction);
    }

    // Show additional visual feedback based on result
    if (resultType === "Hit" || resultType === "kill") {
      // Enemy hit - show hit marker at target location
      if (
        typeof showHitMarker === "function" &&
        targetX !== undefined &&
        targetY !== undefined
      ) {
        showHitMarker(app, targetX, targetY, resultType === "kill");
      }
    }
  }
});
