socket.on("message", (data) => {
	if (data.roomID !== currentRoomID) {
		const roomElement = document.querySelector(`.room[data-roomid="${data.roomID}"]`);
		if (roomElement.querySelector(".unread")) {
			roomElement.querySelector(".unread").innerText = Number(roomElement.querySelector(".unread").innerText) + 1;
		} else {
			const unreadMessage = document.createElement("div");
			unreadMessage.classList.add("unread");
			unreadMessage.innerText = 1;
			roomElement.appendChild(unreadMessage);
		}

		return;
	}

	const messageElement = document.createElement("li");
	messageElement.classList.add("message", data.username === username ? "me" : "other");
	messageElement.innerHTML = `
		<div class="profile">
			<img src="/images/user.png" alt="" /><br />
			<b>${data.username}</b>
		</div>
		<div class="message-bubble">${data.message}</div>
		<div class="time">${new Date().toLocaleTimeString("en-US")}</div>
	`;

	messageList.appendChild(messageElement);
	messageList.scrollTo(0, messageList.scrollHeight);
});

messageInput.addEventListener("keydown", (e) => {
	if (!e.repeat && !e.shiftKey && e.key === "Enter") {
		e.preventDefault();
		sendMessage(messageInput.value);
	}
});
sendButton.addEventListener("click", () => sendMessage(messageInput.value));

function sendMessage(message) {
	if (!message) {
		return;
	}

	socket.emit("message", message);
	messageInput.value = "";
}