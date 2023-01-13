import "dotenv/config";
import pg from "pg";

const db = new pg.Client(process.env.DB_URL);

db.connect((err) => {
	if (err) {
		console.error(err);
		console.error("Database connection failed");
	}

	console.log("Connected to database.");

	db.query("CREATE TABLE IF NOT EXISTS message(id SERIAL PRIMARY KEY, content TEXT NOT NULL, t TIME NOT NULL, username TEXT NOT NULL");
	db.query("CREATE TABLE IF NOT EXISTS user(username TEXT NOT NULL, password TEXT NOT NULL, friends TEXT[] DEFAULT '{}', chatrooms INTEGER[] DEFAULT '{}', friendrequests TEXT[] DEFAULT '{}', roomrequests INTEGER[] DEFAULT '{}')");
	db.query("CREATE TABLE IF NOT EXISTS chatroom(id SERIAL PRIMARY KEY, owner TEXT NOT NULL, roomname TEXT NOT NULL, users TEXT[] DEFAULT '{}', messages INTEGER[] DEFAULT '{}')");
});

export default db;
