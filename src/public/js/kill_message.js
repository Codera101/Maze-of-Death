function displayKillMessage(victim_name, killer_name) {
  if (!killMessage) {
    console.error("killMessage element not found!");
    return;
  }

  console.log("Displaying kill message:", killer_name, "killed", victim_name);

  // Keep max 3 messages
  if (killMessage.children.length >= 3) {
    killMessage.removeChild(killMessage.firstChild);
  }

  let message = document.createElement("div");
  message.className = "kill-notification";

  // Check if current player is involved
  if (
    myPlayer &&
    (killer_name === myPlayer.username || victim_name === myPlayer.username)
  ) {
    message.style.border = "3px solid #ff0000";
    message.style.boxShadow = "0 0 15px rgba(255, 0, 0, 0.5)";
  }

  message.innerHTML = `<span style="color: #ff4444; font-weight: bold;">${killer_name}</span> <span style="color: #ccc;">killed</span> <span style="color: #4444ff; font-weight: bold;">${victim_name}</span>`;
  killMessage.appendChild(message);

  console.log("Message appended. Total messages:", killMessage.children.length);

  // Auto-remove this specific message after 5 seconds
  setTimeout(() => {
    if (message.parentNode === killMessage) {
      killMessage.removeChild(message);
      console.log(
        "Message removed. Remaining messages:",
        killMessage.children.length
      );
    }
  }, 5000);
}

console.log("[KILL_MESSAGE] Script loaded");
console.log("[KILL_MESSAGE] Socket exists:", typeof socket !== "undefined");
console.log("[KILL_MESSAGE] Socket object:", socket);

if (typeof socket !== "undefined") {
  console.log("[KILL_MESSAGE] Registering kill_message event listener");
  socket.on("kill_message", ({ victim_name, killer_name }) => {
    console.log(
      "[KILL_MESSAGE] ✅ Received kill_message event:",
      killer_name,
      "killed",
      victim_name
    );
    displayKillMessage(victim_name, killer_name);
  });
  console.log("[KILL_MESSAGE] Event listener registered successfully");
} else {
  console.error(
    "[KILL_MESSAGE] ❌ Socket is undefined! Cannot register event listener."
  );
}
