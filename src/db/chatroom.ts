import db from "./database";
import { Message, MessageManager } from "./message";

export interface ChatRoom {
	id: number,
	roomname: string,
	users: string[],
	messages: Message[],
	owner: string;
}

export class ChatRoomManager {
	static async getChatRoom(id: number) {
		const { rows } = await db.query("SELECT roomname, users, messages, owner FROM chatroom WHERE id = $1", [id]);
		if (!rows[0]) {
			return {
				id: -1
			} as ChatRoom;
		} else {
			const { roomname, users, messages, owner } = rows[0];

			const messages_: Message[] = [];
			for await (let message of MessageManager.list(messages)) {
				messages_.push(message);
			}

			return {
				id,
				roomname,
				users,
				messages: messages_,
				owner
			} as ChatRoom;
		}
	}

	static async createRoom(roomname: string) {
		await db.query("INSERT INTO chatroom(roomname) VALUES($1)", [roomname]);
	}

	static async addMessage(id: number, message: Message) {
		const chatRoom = await ChatRoomManager.getChatRoom(id);
		if (chatRoom.messages.length >= 100) {
			chatRoom.messages.shift();
		}

		chatRoom.messages.push(message);
	}
}
