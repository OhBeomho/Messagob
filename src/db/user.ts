import db from "./database";
import { ChatRoom, ChatRoomManager } from "./chatroom";

export class User {
	static async getUser(username: string) {
		const { rows } = await db.query(`SELECT friends, chatrooms, friendrequests, roomrequests FROM "user" WHERE username = $1`, [username]);
		if (!rows[0]) {
			return new User("-", [], [], [], []);
		} else {
			const { friends, chatrooms, friendrequests, roomrequests } = rows[0];
			const chatrooms_ = await ChatRoomManager.getChatRooms(chatrooms);
			const roomrequests_ = await ChatRoomManager.getChatRooms(roomrequests);

			return new User(username, friends, friendrequests, roomrequests_, chatrooms_);
		}
	}

	static async getUsers(usernameArray: string) {
		return (await db.query(`SELECT * FROM "user" WHERE username = ANY($1)`, [usernameArray])).rows as User[];
	}

	static async createUser(username: string, password: string) {
		if (!await UserManager.checkUsername(username)) {
			throw new Error("이미 존재하는 사용자입니다.");
		} else if (username.length < 3) {
			throw new Error("사용자명은 3자 이상이여야 합니다.");
		}

		await db.query(`INSERT INTO "user"(username, password) VALUES($1, $2)`, [username, password]);
	}

	private constructor(public username: string, public friends: string[], public friendRequests: string[],
		public roomRequests: ChatRoom[], public chatRooms: ChatRoom[]) { }

	async requestFriend(username: string) {
		if (!(await db.query(`SELECT EXISTS(SELECT * FROM "user" WHERE username = $1)`, [username])).rows[0].exists) {
			throw new Error("존재하지 않는 사용자입니다.");
		}

		const { friendrequests: friendRequests } = (await db.query(`SELECT friendrequests FROM "user" WHERE username = $1`, [username])).rows[0];

		if (friendRequests.includes(this.username)) {
			throw new Error("이미 요청을 보냈습니다.");
		} else if (this.friends.includes(this.username)) {
			throw new Error("이미 친구입니다.");
		}

		await db.query(`UPDATE "user" SET friendrequests = ARRAY_APPEND(friendrequests, $1) WHERE username = $2`, [this.username, username]);
	}

	async accept(username: string) {
		if (!(await db.query(`SELECT EXISTS(SELECT * FROM "user" WHERE username = $1 AND $2 = ANY(friendrequests))`, [this.username, username]))) {
			throw new Error(username + "님의 요청이 없습니다.");
		} else {
			await db.query(`UPDATE "user" SET friendrequests = ARRAY_REMOVE(friendrequests, $1) WHERE username = $2`, [username, this.username]);
			await db.query(`UPDATE "user" SET friends = ARRAY_APPEND(friends, $1) WHERE username = $2`, [username, this.username]);
			await db.query(`UPDATE "user" SET friends = ARRAY_APPEND(friends, $1) WHERE username = $2`, [this.username, username]);

			this.friendRequests.splice(this.friendRequests.indexOf(username), 1);
			this.friends.push(username);
		}
	}

	async decline(username: string) {
		if (!(await db.query(`SELECT EXISTS(SELECT * FROM "user" WHERE username $1 SND $2 = ANY(friendrequests))`, [this.username, username]))) {
			throw new Error(username + "님의 요청이 없습니다.");
		} else {
			await db.query(`UPDATE "user" SET friendrequests = ARRAY_REMOVE(friendrequests, $1) WHERE username = $2`, [username, this.username]);

			this.friendRequests.splice(this.friendRequests.indexOf(username), 1);
		}
	}

	async inviteRoom(roomID: number) {
		if (this.roomRequests.map((room) => room.id).includes(roomID)) {
			throw new Error("이미 초대가 되었습니다.");
		}

		await db.query(`UPDATE "user" SET roomrequests = ARRAY_APPEND(roomrequests, $1) WHERE username = $2`, [roomID, this.username]);
		this.roomRequests.push(await ChatRoomManager.getChatRoom(roomID));
	}

	async joinRoom(roomID: number) {
		if (!this.roomRequests.map((room) => room.id).includes(roomID)) {
			throw new Error("초대받지 않은 방입니다.");
		} else if (this.chatRooms.map((room) => room.id).includes(roomID)) {
			throw new Error("이미 방 인원입니다.");
		}

		await db.query(`UPDATE "user" SET roomrequests = ARRAY_REMOVE(roomrequests, $1) WHERE username = $2`, [roomID, this.username]);
		await db.query("UPDATE chatroom SET users = ARRAY_APPEND(users, $1) WHERE id = $2", [this.username, roomID]);

		this.roomRequests.splice(this.roomRequests.indexOf(this.roomRequests.find((room) => room.id === roomID) as ChatRoom), 1);
		this.chatRooms.push(await ChatRoomManager.getChatRoom(roomID));
	}

	async declineRoom(roomID: number) {
		if (!this.roomRequests.map((room) => room.id).includes(roomID)) {
			throw new Error("초대받지 않은 방입니다.");
		}

		await db.query(`UPDATE "user" SET roomrequests = ARRAY_REMOVE(roomrequests, $1) WHERE username = $2`, [roomID, this.username]);
		this.roomRequests.splice(this.roomRequests.indexOf(this.roomRequests.find((room) => room.id === roomID) as ChatRoom), 1);
	}

	async leaveRoom(roomID: number) {
		const room = await ChatRoomManager.getChatRoom(roomID);
		if (room.id === -1) {
			throw new Error("존재하지 않는 방입니다.");
		} else if (!room.users.includes(this.username)) {
			throw new Error("방 인원이 아닙니다.");
		}

		await db.query("UPDATE chatroom SET users = ARRAY_REMOVE(users, $1) WHERE id = $2", [this.username, roomID]);
		this.chatRooms.splice(this.chatRooms.indexOf(room), 1);
	}
}

export class UserManager {
	static async checkUsername(username: string) {
		return !(await db.query(`SELECT EXISTS(SELECT * FROM "user" WHERE username = $1)`, [username])).rows[0].exists;
	}

	static async checkPassword(username: string, password: string) {
		const { rows } = (await db.query(`SELECT password FROM "user" WHERE username = $1`, [username]));
		if (!rows[0]) {
			throw new Error("존재하지 않는 사용자입니다.");
		} else if (rows[0].password !== password) {
			throw new Error("비밀번호가 일치하지 않습니다.");
		}
	}
}
