// Local Import
import { io, lastSocket } from './server';

// External Imports
import axios from 'axios';
import { Router } from 'express';

// External Typings Imports
import type { Request, Response } from 'express';

// Router
export const router = Router();

// Definitions
const CLIENT_ID = process.env.CLIENT_ID as string;
const CLIENT_SECRET = process.env.CLIENT_SECRET as string;
const REDIRECT_URI = process.env.REDIRECT_URI as string;

// Interfaces
interface IUser {
	id: string;
	authorization: string;
	ip: string;
}

interface ISession {
	id: string;
	alt: boolean;
}

interface IState {
	type: 'error' | 'success';
	code: string;
}

// API Maps
const userMap = new Map<string, IUser>();
const sessionMap = new Map<string, ISession>();

// Functions

const sendAPIError = (res: Response, status: number, message: string): any =>
	res.status(status).json({ type: 'error', message: message });

const sendState = (res: Response, success: boolean, code: string): any =>
	res.status(200).json({ success: success, code: code });

const generateSessionKey = (): string => {
	return new Array(4)
		.fill(0)
		.map(() => Math.random().toString(16).split('.')[1])
		.join('-');
};

const verifySessionKey = (key: string): boolean => {
	return sessionMap.has(key);
};

const getSessionKey = (): string => {
	const key = generateSessionKey();
	if (verifySessionKey(key)) {
		return getSessionKey();
	} else {
		return key;
	}
};

router.get('/auth/callback', async (req: Request, res: Response) => {
	const code = req.query.code as string;
	const state = req.query.state as string;

	if (!state) return sendAPIError(res, 400, 'Malformed callback.');

	const stateID = Buffer.from(state, 'base64').toString();

	if (isNaN(parseInt(stateID)))
		return sendAPIError(res, 400, 'Malformed callback.');

	const params = new URLSearchParams({
		client_id: CLIENT_ID,
		client_secret: CLIENT_SECRET,
		code: code,
		grant_type: 'authorization_code',
		redirect_uri: REDIRECT_URI
	});

	try {
		const tokenRes = await axios.post(
			'https://discord.com/api/oauth2/token',
			params,
			{}
		);
		const token = tokenRes.data.access_token;

		const userRes = await axios.get(
			`https://discord.com/api/v9/users/@me`,
			{
				headers: {
					Authorization: `Bearer ${token}`
				}
			}
		);

		const userIP = req.ip;
		const userID = userRes.data.id;

		if (!userRes) return sendAPIError(res, 400, 'Malformed callback.');
		if (stateID !== userID)
			return sendAPIError(res, 400, 'Malformed callback.');

		const findedAlt = [...userMap.values()].find(
			(user) => user.ip == userIP && user.id != userID
		);

		const sessionKey = getSessionKey();

		if (findedAlt) {
			sessionMap.set(sessionKey, {
				id: userID,
				alt: true
			});
		} else {
			userMap.set(userID, {
				id: userID,
				authorization: token,
				ip: userIP
			});
			sessionMap.set(sessionKey, {
				id: userID,
				alt: false
			});
		}

		res.redirect(`/app/verify/${sessionKey}`);
	} catch (err: any) {
		return res.send('Backend Error: ' + JSON.stringify(err.response.data, null, 2));
	}
});

router.get('/state/:sessionKey', async (req: Request, res: Response) => {
	const sessionKey = req.params.sessionKey;

	if (!sessionKey) return sendAPIError(res, 400, 'Malformed request.');

	if (!verifySessionKey(sessionKey))
		return sendState(res, false, 'SESSION_EXPIRED_OR_INVALID');

	const session = sessionMap.get(sessionKey) as ISession;

	sessionMap.delete(sessionKey);

	if (session.alt) {
		const timeout = 30000;

		const banState = (await new Promise((resolve, reject) => {
			io.to(lastSocket)
				.timeout(timeout)
				.emit('ban', session.id, (_null: any, response: any[]) => {
					resolve(response[0]);
				});

			setTimeout(() => reject('timeout'), timeout);
		}).catch(() => false)) as IState;

		if (!banState)
			return sendState(res, false, 'CANNOT_SEND_REQUEST_TO_BOT');

		if (banState.type == 'error') {
			return sendState(res, false, banState.code);
		}

		return sendState(res, false, 'ALT_ACCOUNTS_ARE_FORBIDDEN');
	}

	const state = (await new Promise((resolve, reject) => {
		const timeout = 15000;

		io.to(lastSocket)
			.timeout(timeout)
			.emit('verify', session.id, (_null: any, response: any[]) => {
				resolve(response[0]);
			});

		setTimeout(() => reject('timeout'), timeout);
	}).catch(() => false)) as IState;

	if (!state) return sendState(res, false, 'CANNOT_SEND_REQUEST_TO_BOT');

	if (state.type == 'error') {
		return sendState(res, false, state.code);
	}

	return sendState(res, true, 'VERIFIED_SUCCESSFULLY');
});
