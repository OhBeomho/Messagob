import db from "./database";

export interface Message {
	id: number;
	content: string;
	time: Date;
	username: string;
}

export class MessageManager {
	static async getMessage(id: number) {
		const { rows } = await db.query("SELECT content, t, username FROM message WHERE id = $1", [id]);
		if (!rows[0]) {
			return {} as Message;
		}

		const { content, t: time, username } = rows[0];
		return {
			id,
			content,
			time,
			username
		} as Message;
	}

	static async save(username: string, content: string) {
		return (await db.query("INSERT INTO message(username, content, t) VALUES($1, $2, $3) RETURNING *", [username, content, new Date()])).rows[0] as Message;
	}

	static async list(messageIDArray: number[]) {
		return (await db.query("SELECT * FROM message WHERE id = ANY($1)", [messageIDArray])).rows as Message[];
	}
}
