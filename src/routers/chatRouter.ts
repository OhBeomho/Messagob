import { Router } from "express";
import { ChatRoomManager } from "../db/chatroom";

const router = Router();

router.get("/list/:roomid", (req, res) => {
	const { roomid } = req.params;
	ChatRoomManager.getChatRoom(parseInt(roomid))
		.then((room) => {
			if (room.id === -1) {
				res.sendStatus(404);
			} else {
				res.send(JSON.stringify(room.messages));
			}
		}).catch(() => res.sendStatus(500));
});

export default router;
