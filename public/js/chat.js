socket.on("message", (data) => {
	if (data.roomID !== currentRoomID) {
		// TODO: 방 메시지 알림
	}

	// TODO: 메시지 목록에 메시지 추가
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

	socket.emit("message", {
		message,
		roomID: currentRoomID
	});
}