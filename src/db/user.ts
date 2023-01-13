import db from "./database";

export class User {
	username: string;
	friends: string[];
	chatRooms: number[];
	friendRequests: string[];
	roomRequests: number[];

	static async getUser(username: string) {
		const { rows } = await db.query("SELECT friends, chatrooms, friendrequests, roomrequests FROM user WHERE username = $1", [username]);
		if (!rows[0]) {
			return new User("Not found", [], [], [], []);
		} else {
			const { friends, chatrooms, friendrequests, roomrequests } = rows[0];
			return new User(username, friends, friendrequests, roomrequests, chatrooms);
		}
	}

	static async createUser(username: string, password: string) {
		if (!await UserManager.checkUsername(username)) {
			throw new Error("Already exists.");
		}

		await db.query("INSERT INTO user(username, password) VALUES($1, $2)", [username, password]);
	}

	private constructor(username: string, friends: string[], friendRequests: string[], roomRequests: number[], chatRooms: number[]) {
		this.username = username;
		this.friends = friends;
		this.friendRequests = friendRequests;
		this.roomRequests = roomRequests;
		this.chatRooms = chatRooms;
	}

	async requestFriend(targetUsername: string) {
		if (!(await db.query("SELECT EXISTS(SELECT * FROM user WHERE username = $1)", [targetUsername])).rows[0].exists) {
			throw new Error("존재하지 않는 사용자입니다.");
		}

		const { friendrequests: friendRequests, friends } = (await db.query("SELECT friendrequests, friends FROM user WHERE username = $1", [targetUsername])).rows[0];

		if (friendRequests.includes(this.username)) {
			throw new Error("이미 요청을 보냈습니다.");
		} else if (friends.includes(this.username)) {
			throw new Error("이미 친구입니다.");
		}

		await db.query("UPDATE user SET friendrequests = ARRAY_APPEND(friendrequests, $1) WHERE username = $2", [this.username, targetUsername]);
	}

	async accept(requestUsername: string) {
		if (!(await db.query("SELECT EXISTS(SELECT * FROM user WHERE username = $1 AND $2 = ANY(friendrequests))", [this.username, requestUsername]))) {
			throw new Error(requestUsername + "님의 요청이 없습니다.");
		} else {
			await db.query("UPDATE user SET friendrequests = ARRAY_REMOVE(friendrequests, $1) WHERE username = $2", [requestUsername, this.username]);
			await db.query("UPDATE user SET friends = ARRAY_APPEND(friends, $1) WHERE username = $2", [requestUsername, this.username]);
			await db.query("UPDATE user SET friends = ARRAY_APPEND(friends, $1) WHERE username = $2", [this.username, requestUsername]);
		}
	}

	async decline(requestUsername: string) {
		if (!(await db.query("SELECT EXISTS(SELECT * FROM user WHERE username $1 SND $2 = ANY(friendrequests))", [this.username, requestUsername]))) {
			throw new Error(requestUsername + "님의 요청이 없습니다.");
		} else {
			await db.query("UPDATE user SET friendrequests = ARRAY_REMOVE(friendrequests, $1) WHERE username = $2", [requestUsername, this.username]);
		}
	}

	async inviteRoom(roomID: number) { }

	async joinRoom(roomID: number) { }

	async leaveRoom(roomID: number) { }
}

export class UserManager {
	static async checkUsername(username: string) {
		return !(await db.query("SELECT EXISTS(SELECT * FROM user WHERE username = $1)", [username])).rows[0].exists;
	}

	static async checkPassword(username: string, password: string) {
		const userPassword = (await db.query("SELECT password FROM user WHERE username = $1", [username])).rows[0].password;

		if (userPassword !== password) {
			throw new Error("Password is incorrect.");
		}
	}
}
