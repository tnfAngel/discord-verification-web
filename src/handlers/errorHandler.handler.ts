// External Typings Imports
import type { Request, Response, NextFunction } from 'express';

export const errorHandler = (
	error: any,
	_req: Request,
	res: Response,
	_next: NextFunction
) => {
	if (!error.statusCode) error.statusCode = 500;

	if (error.statusCode === 404) {
		return res.status(error.statusCode).send('Not Found');
	}

	return res
		.status(error.statusCode)
		.json({ statusCode: error.statusCode, message: error.message });
};
