import { NextFunction, Request, Response } from "express";

export default function(fn: Function) {
	return async function(req: Request, res: Response, next: NextFunction) {
		try {
			await fn(req, res, next);
		} catch (e) {
			next(e);
		}
	}
}