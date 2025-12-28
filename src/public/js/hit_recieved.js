let hitSound = new Audio("../sounds/hitHurt.wav");

socket.on("got_hit", ({ dir, shooter_name }) => {
  hitSound.play();
  if (typeof animateHit === "function" && app) {
    animateHit(app, myPlayer.id);
  }
  if (typeof mazeContainer !== "undefined" && mazeContainer) {
    mazeContainer.style.boxShadow = "inset 0 0 50px rgba(255, 0, 0, 0.8)";
    setTimeout(() => {
      mazeContainer.style.boxShadow = "";
    }, 300);
  }
});
