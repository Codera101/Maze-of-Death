function displayKillMessage(victim_name, killer_name) {
  if (killMessage.children.length >= 3) {
    killMessage.removeChild(killMessage.firstChild);
  }
  let message = document.createElement("div");

  if (killer_name === myPlayer.username || victim_name === myPlayer.username) {
    message.style.border = "3px solid red";
  }

  message.innerHTML = ` <span style="color: red;">${killer_name}</span>  killed  <span style="color: blue;">${victim_name}</span>`;
  killMessage.appendChild(message);
}

socket.on("kill_message", ({ victim_name, killer_name }) => {
  console.log("[FRONTEND] Received kill_message:", {
    victim_name,
    killer_name,
  });
  displayKillMessage(victim_name, killer_name);
  console.log("[FRONTEND] Kill message displayed");
});

// displayKillMessage("mo", "Joe");
