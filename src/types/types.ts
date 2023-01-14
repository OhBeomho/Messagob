import { Session } from "express-session";
import { User } from "../db/user";

declare module "express-session" {
	interface SessionData {
		user?: User;
	}
}

declare module "http" {
	interface IncomingMessage {
		session: Session & {
			user?: User;
		}
	}
}
