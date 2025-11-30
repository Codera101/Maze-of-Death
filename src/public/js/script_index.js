const username = document.getElementById("username");
const counter = document.getElementById("counter");

//?--------------    BUTTONS_CONTAINER    -----------------/

const play_btn_container = document.getElementById("play_btn_container");
const spectator_btn_container = document.getElementById(
  "spectator_mode_btn_container"
);
const how_to_play_btn_container = document.getElementById(
  "how_to_play_btn_container"
);

const play_btn = document.getElementById("play_btn");

//?--------------    COUNTER    --------------------/

username.addEventListener("input", () => {
  counter.textContent = `${username.value.length}/20`;
  //   play_btn_container.disabled = username.value.trim().length === 0;
});

//?--------------   PLAY_BUTTON   -----------------/

function updatePlayButtonState() {
  const isEmpty = username.value.trim().length === 0;

  play_btn.disabled = isEmpty;

  if (isEmpty) {
    play_btn_container.classList.add("disabled");
  } else {
    play_btn_container.classList.remove("disabled");
  }
}

updatePlayButtonState();
username.addEventListener("input", updatePlayButtonState);

//?------------    POPUP_CONTROLLER    ---------------------------/

const popup = document.querySelector(".popup_container");
const backdrop = document.getElementById("popup_backdrop");

const open_btn = how_to_play_btn_container;
const close_btn = document.getElementById("close_btn");
const got_it_btn = document.getElementById("got_it_btn_container");

function openPopup() {
  popup.classList.add("active");
  backdrop.classList.add("active");
}

function closePopup() {
  popup.classList.remove("active");
  backdrop.classList.remove("active");
}

if (open_btn) {
  open_btn.addEventListener("click", openPopup);
}

close_btn.addEventListener("click", closePopup);

got_it_btn.addEventListener("click", closePopup);

backdrop.addEventListener("click", closePopup);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closePopup();
});

//?--------------  socket.io(join_player)  -----------------/



//& Send join request
play_btn_container.addEventListener("click", () => {
  const username_value = username.value.trim();
  console.log(username_value);
  if (!username_value) return;
  
  window.location.href = `/game?username=${encodeURIComponent(username_value)}`;

});

//& Broadcast for other players
// socket.on("player_joined_broadcast", (player) => {
//   console.log("Someone joined:", player);
// });

//?--------------     TEST      -----------------/

// play_btn_container.addEventListener("click", () => {
//   if (!play_btn.disabled) {
//     alert("Starting game for: " + username.value);
//   }
// });

// spectator_btn_container.addEventListener("click", () => {
//   alert("Entering Spectator Mode");
// });
