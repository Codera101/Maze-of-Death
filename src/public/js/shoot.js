

window.addEventListener("keydown", (e) => {
    if (e.code === "Space") {
        socket.emit("shoot");
    }
});

// window.addEventListener("keyup", (e) => {
//     if (e.code === "Space") {
//         shooting = false;
//     }
// });

// function shoot() {
//     if (shooting) {
//     }
// }

socket.on("target_hit", ( { status } ) => {
    if (status === true) {
        console.log("Target hit!");
    }
})