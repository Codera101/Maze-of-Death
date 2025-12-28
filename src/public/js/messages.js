function displayKillMessage(victim_name, killer_name) {
  if (!killMessage) {
    console.error("killMessage element not found!");
    return;
  }

  // console.log("Displaying kill message:", killer_name, "killed", victim_name);

  // Keep max 3 messages - properly remove old ones
  while (killMessage.children.length >= 3) {
    const oldMessage = killMessage.firstChild;
    killMessage.removeChild(oldMessage);
    // Clear any pending timeouts to prevent memory leaks
    if (oldMessage._removeTimeout) {
      clearTimeout(oldMessage._removeTimeout);
    }
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

  // console.log("Message appended. Total messages:", killMessage.children.length);

  // Auto-remove this specific message after 5 seconds
  // Store timeout ID to allow cleanup if needed
  message._removeTimeout = setTimeout(() => {
    if (message.parentNode === killMessage) {
      killMessage.removeChild(message);
      message._removeTimeout = null;
      // console.log(
      //   "Message removed. Remaining messages:",
      //   killMessage.children.length
      // );
    }
  }, 5000);
}

if (typeof socket !== "undefined") {
  // console.log("[KILL_MESSAGE] Registering kill_message event listener");
  socket.on("kill_message", ({ victim_name, killer_name }) => {
    // console.log(
    //   "[KILL_MESSAGE] ✅ Received kill_message event:",
    //   killer_name,
    //   "killed",
    //   victim_name
    // );
    displayKillMessage(victim_name, killer_name);
  });
  // console.log("[KILL_MESSAGE] Event listener registered successfully");
} else {
  console.error(
    "[KILL_MESSAGE] ❌ Socket is undefined! Cannot register event listener."
  );
}

// ------------------------ ERROR MESSAGE POPUP -----------------//
let handleErrorMessage = (message) => {
  const error_popup = document.getElementById("error-popup");
  const error_message_text = document.getElementById("error-txt");
  const backdrop = document.getElementById("popup-backdrop");
  error_popup.style.display = "flex";
  error_popup.classList.add("active");
  backdrop.classList.add("active");
  error_message_text.innerHTML = message;

  let disablePopup = () => {
    error_popup.style.display = "none";
    error_popup.classList.remove("active");
    backdrop.classList.remove("active");
    error_message_text.innerHTML = "";
    window.location.href = "/";
  };

  backdrop.addEventListener("click", () => disablePopup());
  setTimeout(() => disablePopup(), 5000);
};

socket.on("room_full", (data) => {
  handleErrorMessage(data.message || "Room is full. Please try again later.");
});

socket.on("username_taken", (data) => {
  let userName = data.username || "This username";
  console.log(data);
  handleErrorMessage(
    `"${userName}" is already taken.<br>Please choose a different name.`
  );
});
