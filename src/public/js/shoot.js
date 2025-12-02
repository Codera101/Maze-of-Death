import { app } from "./maze.js";

window.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    socket.emit("shoot");
  }
});
window.addEventListener("click", (e) => {
  if (e.button === 0) {
    socket.emit("shoot");
  }
});

// window.addEventListener("keyup", (e) => {
//     if (e.code === "Space") {
//         shooting = false;
//     }
// });

// function shoot() {
//     if (shooting) {
//     }
// }

socket.on("target_hit", (data) => {
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
    // console.log("Target hit!", data);

    // Show different visual feedback based on result
    if (resultType === "Hit" || resultType === "kill") {
      // Enemy hit - show hit marker at target location
      if (
        typeof showHitMarker === "function" &&
        typeof app !== "undefined" &&
        targetX !== undefined &&
        targetY !== undefined
      ) {
        showHitMarker(app, targetX, targetY, resultType === "kill");
      }
    } else if (resultType === "Nothing") {
      // Wall hit - show wall impact at shooter's direction
      if (
        typeof showWallImpact === "function" &&
        typeof app !== "undefined" &&
        typeof myPlayer !== "undefined"
      ) {
        showWallImpact(app, myPlayer.x, myPlayer.y, direction);
      }
    }
  }
});
