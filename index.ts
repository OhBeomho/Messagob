import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import express_session, { Session } from "express-session";
import fileStore from "session-file-store";
import http from "http";
import { Server } from "socket.io";
import { renderFile } from "ejs";
import userRouter from "./src/routers/userRouter";
import chatRouter from "./src/routers/chatRouter";

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const FileStore = fileStore(express_session);
const session = express_session({
	secret: String(process.env.SESSION_SECRET),
	resave: false,
	saveUninitialized: true,
	store: new FileStore()
});

app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session);

app.use("/user", userRouter);
app.use("/chat", chatRouter);

app.set("view engine", "ejs");
app.set("views", "views");

app.engine("html", renderFile);

io.use((socket, next) => session(socket.request as Request, {} as Response, next as NextFunction));

io.on("connection", (socket) => {
	const user = socket.request.session.user;
	user && socket.join(user.username);

	socket.on("message", (data) => {
		if (!user) return;

		io.to(data.username).to(user.username).emit("message", {
			username: user.username,
			message: data.message,
		});
	});
});

const PORT = Number(process.env.PORT);
server.listen(PORT, () => console.log("Server is listening on port " + PORT));
