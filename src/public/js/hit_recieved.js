import { app } from "./maze.js";

socket.on("got_hit", ({ dir, shooter_name }) => {
  // console.log(`Got hit from ${shooter_name} in direction ${dir}`);

  // Trigger hit animation
  if (typeof animateHit === "function" && app) {
    animateHit(app, myPlayer.id);
  }

  // Visual feedback - brief red border flash on screen
  if (typeof mazeContainer !== "undefined" && mazeContainer) {
    mazeContainer.style.boxShadow = "inset 0 0 50px rgba(255, 0, 0, 0.8)";
    setTimeout(() => {
      mazeContainer.style.boxShadow = "";
    }, 300);
  }
});
