import { NextFunction, Request, Response, Router } from "express";
import { ChatRoomManager } from "../db/chatroom";
import { MessageManager } from "../db/message";
import wrap from "./asyncWrapper";

const router = Router();

router.post("/save", (req, _res) => {
	if (!req.session.user) {
		return;
	}

	const { content } = req.body;
	const { username } = req.session.user;

	MessageManager.save(username, content);
});

router.get("/list/:roomid", wrap(async (req: Request, res: Response, _next: NextFunction) => {
	const { roomid } = req.params;
	const room = await ChatRoomManager.getChatRoom(parseInt(roomid));

	if (room.id === -1) {
		res.sendStatus(404);
	} else {
		res.send(room.messages);
	}
}));

export default router;
