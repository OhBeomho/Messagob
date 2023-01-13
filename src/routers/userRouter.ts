import { Router } from "express";
import { User, UserManager } from "../db/user";

const router = Router();

router.route("/login")
	.get((_, res) => res.render("login.html"))
	.post((req, res, next) => {
		const { username, password } = req.body;

		if (!username || !password) {
			res.render("error", { err: "사용자명과 비밀번호 모두 입력해 주세요." });
		}

		UserManager.checkPassword(username, password)
			.then(async () => {
				req.session.user = await User.getUser(username);
				res.redirect("/");
			});
	});

router.route("/signup")
	.get((_, res) => res.render("signup.html"))
	.post((req, res) => {
		// TODO: Sign up
	});

export default router;
