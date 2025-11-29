const username = document.getElementById("username");
const counter = document.getElementById("counter");
const play_btn = document.getElementById("play_btn");
const play_btn_container = document.getElementById("play_btn_container");

//*********COUNTER****************/

username.addEventListener("input", () => {
  counter.textContent = `${username.value.length}/20`;
  play_btn.disabled = username.value.trim().length === 0;
});

// ********PLAY_BUTTON**********/
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

//*********POPUP_CONTROLLER*************/

//***********TEST**************/

// play_btn.addEventListener("click", () => {
//   alert("Starting game for: " + username.value);
// });

// document.getElementById("spectator_mode_btn").addEventListener("click", () => {
//   alert("Entering Spectator Mode");
// });
