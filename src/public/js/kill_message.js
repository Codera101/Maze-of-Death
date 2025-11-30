
function displayKillMessage(victim_name, killer_name) {
    if (killMessage.children.length >= 3) {
        killMessage.removeChild(killMessage.firstChild);
    }

    let message = document.createElement("div");
    message.innerHTML = ` <span style="color: red;">${killer_name}</span>  killed  <span style="color: blue;">${victim_name}</span>`;
    killMessage.appendChild(message);
}

socket.on("kill_message", ({ victim_name, killer_name }) => {
    displayKillMessage(victim_name, killer_name);
    console.log("add kill message");
    
})

displayKillMessage("mo", "Joe");