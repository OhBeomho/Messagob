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
			return { id: -1 } as ChatRoom;
		}

		const { roomname, users, messages, owner } = rows[0];
		const messages_: Message[] = await MessageManager.list(messages);

		return {
			id,
			roomname,
			users,
			messages: messages_,
			owner
		} as ChatRoom;
	}

	static async getChatRooms(chatRoomIDArray: number[]) {
		return (await db.query("SELECT * FROM chatroom WHERE id = ANY($1)", [chatRoomIDArray])).rows as ChatRoom[];
	}

	static async createRoom(roomname: string, owner: string) {
		const id = (await db.query("INSERT INTO chatroom(roomname, owner) VALUES($1, $2) RETURNING id", [roomname, owner])).rows[0].id;
		await db.query(`UPDATE "user" SET chatrooms = ARRAY_APPEND(chatrooms, $1) WHERE username = $2`, [id, owner]);
	}

	static async addMessage(id: number, message: Message) {
		const chatRoom = await ChatRoomManager.getChatRoom(id);
		if (chatRoom.messages.length >= 100) {
			chatRoom.messages.shift();
		}

		chatRoom.messages.push(message);
		await db.query("UPDATE chatroom SET messages = $1 WHERE id = $2", [chatRoom.messages.map((message) => message.id), id]);
	}
}
