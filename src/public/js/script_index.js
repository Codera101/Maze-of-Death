const username = document.getElementById("username");
const counter = document.getElementById("counter");

//?     BUTTONS_CONTAINER      /

const play_btn_container = document.getElementById("play_btn_container");
const spectator_btn_container = document.getElementById(
  "spectator_mode_btn_container"
);
const how_to_play_btn_container = document.getElementById(
  "how_to_play_btn_container"
);

const play_btn = document.getElementById("play_btn");

//?   COUNTER          /

username.addEventListener("input", () => {
  counter.textContent = `${username.value.length}/20`;
  //   play_btn_container.disabled = username.value.trim().length === 0;
});

//?     PLAY_BUTTON      /

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

//?     POPUP_CONTROLLER      /


