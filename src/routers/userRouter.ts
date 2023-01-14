import { Router } from "express";
import { User, UserManager } from "../db/user";

const router = Router();

router.route("/login")
	.get((_, res) => res.render("login"))
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
	.get((_req, res) => res.render("signup"))
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

router.get("/logout", (req, res) => {
	if (!req.session.user) {
		return;
	}

	req.session.destroy(() => {});
	res.redirect("/");
});

router.get("/checkusername/:username", (req, res) => {
	const { username } = req.params;

	if (!username) {
		return;
	} else if (username.length < 3) {
		res.status(500).send("사용자명은 3자 이상이여야 합니다.");
		return;
	}

	UserManager.checkUsername(username)
		.then((result) => res.status(200).send(result))
		.catch(() => res.sendStatus(500));
});

export default router;
