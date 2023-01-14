import { NextFunction, Router } from "express";
import { User, UserManager } from "../db/user";

const router = Router();

router.route("/login")
	.get((_, res) => res.render("login.html"))
	.post((req, res, next) => {
		const { username, password } = req.body;

		if (!username || !password) {
			next(new Error("사용자명과 비밀번호 모두 입력해 주세요."));
		} else {
			UserManager.checkPassword(username, password)
				.then(() => {
					User.getUser(username).then((user) => {
						req.session.user = user;
						res.redirect("/");
					});
				})
				.catch((e) => next(e));
		}
	});

router.route("/signup")
	.get((_, res) => res.render("signup.html"))
	.post((req, res, next) => {
		const { username, password, confirmPassword } = req.body;

		if (!username || !password || !confirmPassword) {
			next(new Error("사용자명과 비밀번호 모두 입력해 주세요."));
		} else if (password !== confirmPassword) {
			next(new Error("비밀번호가 일치하지 않습니다."));
		} else {
			User.createUser(username, password)
				.then(() => res.redirect("/user/login"))
				.catch((e) => next(e));
		}
	});

export default router;
