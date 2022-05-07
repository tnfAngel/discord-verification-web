// External Typings imports
import type { Request, Response, NextFunction } from 'express';

export const notFoundMW = (
	_req: Request,
	_res: Response,
	next: NextFunction
) => {
	const error = new Error('Not Found') as any;
	error.statusCode = 404;

	next(error);
};
