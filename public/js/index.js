const xhr = new XMLHttpRequest();
let currentRoomID = -1;

const socket = io();

const messageList = document.getElementById("messageList");
const friendList = document.getElementById("friendList");
const roomList = document.getElementById("roomList");
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("send");
const friendRequestInput = document.getElementById("friendRequestInput");
const inviteRoomSelect = document.getElementById("inviteRoomSelect");
const inviteFriendSelect = document.getElementById("inviteFriendSelect");

window.addEventListener("load", () => {
	const rooms = document.querySelectorAll(".room");
	for (let roomElement of rooms) {
		roomElement.addEventListener("click", () => {
			if (![XMLHttpRequest.UNSET, XMHttpRequest.DONE].includes(xhr.readyState)) {
				return;
			}

			const roomname = roomElement.querySelector("b").innerText;
			currentRoomID = parseInt(roomElement.dataset.roomid);

			socket.emit("room", currentRoomID);

			document.querySelector("#chat .title").innerText = "채팅 - " + roomname;
			showMessages(currentRoomID);
		});
	}
});

function showMessages(roomID) {
	messageList.innerHTML = "";

	const loadingElement = document.createElement("li");
	loadingElement.innerText = "메시지 로딩 중...";

	messageList.appendChild(loadingElement);

	messageInput.disabled = true;
	sendButton.disabled = true;

	xhr.open("GET", "/chat/list/" + roomID);
	xhr.onreadystatechange = () => {
		if (xhr.readyState === 4) {
			messageInput.disabled = false;
			sendButton.disabled = false;

			if (xhr.status === 404) {
				alert("존재하지 않는 방입니다.");
			} else if (xhr.status === 500) {
				alert("서버에서 오류가 발생하였습니다.");
			} else {
				const messages = JSON.parse(xhr.response);
				messageList.innerHTML = "";

				for (let message of messages) {
					const messageElement = document.createElement("li");
					messageElement.classList.add("message");
					messageElement.innerHTML = `
						<div class="profile">
							<img src="/images/user.png" alt="" /><br />
							<b>${message.username}</b>
						</div>
						<div class="message-bubble">${message.content}</div>
						<div class="time">${message.time.toLocaleTimeString("en-US")}</div>
					`;

					messageList.appendChild(messageElement);
				}

				if (!messages.length) {
					const noMessageElement = document.createElement("li");
					noMessageElement.innerText = "메시지가 없습니다.";

					messageList.appendChild(noMessageElement);
				}

				messageList.scrollTo(0, messageList.scrollHeight);
				return;
			}

			const failedElement = document.createElement("li");
			failedElement.innerText = "메시지를 불러올 수 없습니다.";

			messageList.appendChild(failedElement);
		}
	};
	xhr.send();
}

function sendRequest(method, url, data, callback) {
	const xhr = new XMLHttpRequest();
	xhr.open(method, url);
	xhr.setRequestHeader("Content-Type", "application/json");
	xhr.onreadystatechange = () => {
		if (xhr.readyState === 4) {
			callback(xhr.status, xhr.response);
		}
	};
	xhr.send(data);
}

function acceptFriend(username) {
	document.getElementById("Request" + username).querySelector("button").disabled = true;

	sendRequest("GET", "/user/acceptfriend/" + username, {}, (status, response) => {
		if (status === 500) {
			alert("서버에서 오류가 발생하였습니다.");
			console.error(response);
			document.getElementById("Request" + username).querySelector("button").disabled = false;
			return;
		}

		document.getElementById("Request" + username).remove();

		const friendElement = document.createElement("li");
		friendElement.innerHTML = `	
			<img src="/images/user.png" alt="" />
			<b><%= friend %></b>
		`;

		if (friendList.querySelector(".no-friends")) {
			friendList.innerHTML = "";
		}

		friendList.appendChild(friendElement);
	});
}

function declineFriend(username) {
	document.getElementById("Request" + username).querySelector("button").disabled = true;
	sendRequest("GET", "/user/declinefriend/" + username, {}, (_status, _response) => document.getElementById("Request" + username).remove());
}

function acceptRoom(roomID) {
	document.getElementById("RoomRequest" + roomID).querySelector("button").disabled = true;

	sendRequest("GET", "/room/acceptroom/" + roomID, {}, (status, response) => {
		if (status === 500) {
			alert("서버에서 오류가 발생하였습니다.");
			console.error(response);
			document.getElementById("RoomRequest" + roomID).querySelector("button").disabled = false;
			return;
		}

		document.getElementById("RoomRequest" + roomID).remove();

		const roomElement = document.createElement("li");
		roomElement.innerHTML = `	
			<img src="/images/chat.png" alt="" />
			<b>${response}</b>
		`;

		if (roomList.querySelector(".no-rooms")) {
			roomList.innerHTML = "";
		}

		roomList.appendChild(roomElement);
	});
}

function declineRoom(roomID) {
	document.getElementById("RoomRequest" + roomID).querySelector("button").disabled = true;
	sendRequest("GET", "/room/declineroom/" + roomID, {}, (_status, _response) => document.getElementById("RoomRequest" + roomID).remove());
}

function requestFriend() {
	if (!friendRequestInput.value) {
		return;
	}

	sendRequest("GET", "/user/friendrequest/" + friendRequestInput.value, {}, (status, response) => {
		if (status === 500) {
			alert("서버에서 오류가 발생하였습니다.");
			console.error(response);
			return;
		}

		alert("친구 요청을 보냈습니다.");
	});
}

function invite() {
	const inviteRoom = inviteRoomSelect.value;
	const targetFriends = inviteFriendSelect.selectedOptions;

	if (!inviteRoom || !targetFriends.length) {
		return;
	}

	sendRequest("POST", "/room/inviteroom/", inviteRoom, { friends: targetFriends }, (status, response) => {
		if (status === 500) {
			alert("서버에서 오류가 발생하였습니다.");
			return;
		}

		alert("초대 요청을 보냈습니다.");
	});
}