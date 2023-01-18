import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import express_session, { Session } from "express-session";
import fileStore from "session-file-store";
import http from "http";
import { Server } from "socket.io";
import userRouter from "./src/routers/userRouter";
import roomRouter from "./src/routers/roomRouter";
import chatRouter from "./src/routers/chatRouter";
import { User } from "./src/db/user";
import { MessageManager } from "./src/db/message";
import { ChatRoomManager } from "./src/db/chatroom";

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const FileStore = fileStore(express_session);
const session = express_session({
	secret: String(process.env.SESSION_SECRET),
	resave: false,
	saveUninitialized: true,
	store: new FileStore(),
	name: "connect.sid"
});

declare module "express-session" {
	export interface SessionData {
		user?: string;
	}
}

declare module "http" {
	export interface IncomingMessage {
		session: Session & {
			user?: string;
		}
	}
}

app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session);

app.use("/user", userRouter);
app.use("/room", roomRouter);
app.use("/chat", chatRouter);

app.set("view engine", "ejs");
app.set("views", "views");

app.get("/", (req, res) => {
	if (!req.session.user) {
		res.render("index", { user: undefined });
		return;
	}

	User.getUser(req.session.user)
		.then((user) => res.render("index", { user }));
});

io.use((socket, next) => session(socket.request as Request, {} as Response, next as NextFunction));

io.on("connection", (socket) => {
	const user = socket.request.session.user;
	let currentRoomID = -1;

	socket.on("message", (message) => {
		if (!user || currentRoomID === -1) return;

		io.to(String(currentRoomID)).emit("message", {
			username: user,
			message,
			roomID: currentRoomID
		});

		MessageManager.save(user, message)
			.then((message) => ChatRoomManager.addMessage(currentRoomID, message));
	});
	socket.on("room", (roomID) => {
		currentRoomID = roomID;
	});
	socket.on("rooms", (roomIDArray) => {
		for (let roomID of roomIDArray) {
			socket.join(String(roomID));
		}
	});
});

const PORT = Number(process.env.PORT);
server.listen(PORT, () => console.log("Server is listening on port " + PORT));
