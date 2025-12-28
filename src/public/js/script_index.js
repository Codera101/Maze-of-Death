const usernameInput = document.getElementById("username");
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

usernameInput.addEventListener("input", () => {
  counter.textContent = `${usernameInput.value.length}/20`;
});

//?--------------   PLAY_BUTTON   -----------------/

function updatePlayButtonState() {
  const isEmpty = usernameInput.value.trim().length === 0;

  play_btn.disabled = isEmpty;

  if (isEmpty) {
    play_btn_container.classList.add("disabled");
  } else {
    play_btn_container.classList.remove("disabled");
  }
}

updatePlayButtonState();
usernameInput.addEventListener("input", updatePlayButtonState);

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
window.isViewer = false;
//& Send join request
play_btn_container.addEventListener("click", () => {
  const username_value = usernameInput.value.trim();
  if (!username_value) return;
  window.isViewer = false;
  window.location.href = `/game?username=${encodeURIComponent(username_value)}`;
});
spectator_btn_container.addEventListener("click", () => {
  window.isViewer = true;
  window.location.href = `/view`;
});
