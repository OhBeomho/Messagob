import { Router } from "express";
import { ChatRoomManager } from "../db/chatroom";
import { User } from "../db/user";

const router = Router();

router.post("/inviteroom/:roomid", (req, res) => {
	const { roomid } = req.params;
	const { friends } = req.body;

	User.getUsers(friends)
		.then((users) => {
			for (let user of users) {
				user.inviteRoom(parseInt(roomid)).catch((e) => res.status(500).send(e));
			}
		}).catch(() => res.sendStatus(500));
});

router.get("/acceptroom/:roomid", (req, res) => {
	const { roomid } = req.params;
	req.session.user && User.getUser(req.session.user)
		.then((user) => {
			user.joinRoom(parseInt(roomid))
				.then(() => {
					ChatRoomManager.getChatRoom(parseInt(roomid))
						.then((room) => res.send(room.roomname))
						.catch(() => res.sendStatus(500));
				}).catch(() => res.sendStatus(500));
		});
});

router.get("/declineroom/:roomid", (req, _res) => {
	const { roomid } = req.params;
	req.session.user && User.getUser(req.session.user)
		.then((user) => user.declineRoom(parseInt(roomid)));
});

router.get("/leaveroom/:roomid", (req, _res) => {
	const { roomid } = req.params;
	req.session.user && User.getUser(req.session.user)
		.then((user) => user.leaveRoom(parseInt(roomid)));
});

router.get("/createroom/:roomname", (req, res) => {
	const { roomname } = req.params;
	req.session.user && ChatRoomManager.createRoom(roomname, req.session.user)
		.then(() => res.sendStatus(200))
		.catch(() => res.sendStatus(500));
});

export default router;