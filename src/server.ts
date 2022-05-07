export {};

// External imports
import express, {
	json as jsonMW,
	urlencoded as urlencodedMW,
	static as expressStatic
} from 'express';
import { createServer as httpServer } from 'http';
import { Server as IOServer } from 'socket.io';
import { join as joinPath } from 'path';
import morgan from 'morgan';
import 'dotenv/config';

// Local imports
import { notFoundMW } from './middlewares/notFound.middleware';
import { errorHandler } from './handlers/errorHandler.handler';
import { router as apiMW } from './api';

// External Typings imports
import type { Request, Response } from 'express';

// Definitions
const CLIENT_ID = process.env.CLIENT_ID as string;
const CLIENT_SECRET = process.env.CLIENT_SECRET as string;

// App & Server
const app = express();
const server = httpServer(app);
const port = process.env.PORT ?? 3000;
export const io = new IOServer(server);
export let lastSocket = '';

// App settings
app.set('port', port);
app.set('json spaces', 2);
app.set('trust proxy', true);

// Middlewares
app.use(morgan('dev'));
app.use(jsonMW());
app.use(
	urlencodedMW({
		extended: false
	})
);

// Path Middlewares
app.use('/static', expressStatic(joinPath(__dirname, './static')));
app.use('/assets', expressStatic(joinPath(__dirname, './static/assets')));

// API MW
app.use('/api', apiMW);

// Routes
app.get('/', (_req: Request, res: Response): void => {
	res.redirect('https://discord.gg/8RNAdpK');
});

app.get('/app/verify/:sessionKey', (_req: Request, res: Response): void => {
	res.sendFile('static/html/verify.html', { root: __dirname });
});

app.get('*', notFoundMW);

app.use(errorHandler);

// Starting the server
server.listen(app.get('port'), (): void => {
	console.log(`==== Server ready ====`);
	console.log(`Port: ${app.get('port')}`);
	console.log(`Environment: ${process.env.NODE_ENV}`);
	console.log(`Node version: ${process.version}`);
	console.log(`Visit: http://localhost:${app.get('port')}`);
	console.log(`==== End Server ready ====`);
});

// Socket.io Server
io.use((socket, next) => {
	if (
		socket.handshake.auth &&
		socket.handshake.auth.id &&
		socket.handshake.auth.secret
	) {
		if (!socket.handshake.auth.id) {
			return next(new Error('Malformed handshake auth error'));
		}
		if (!socket.handshake.auth.secret) {
			return next(new Error('Malformed handshake auth error'));
		}
		if (socket.handshake.auth.id !== CLIENT_ID) {
			return next(new Error('Authentication error'));
		}
		if (socket.handshake.auth.secret !== CLIENT_SECRET) {
			return next(new Error('Authentication error'));
		}

		return next();
	} else {
		return next(new Error('Authentication error'));
	}
}).on('connection', (socket): void => {
	try {
		console.log(
			`[WebSocket] (BOT_CLIENT) A connection has been made. (${socket.id}).`
		);

		lastSocket = socket.id;

		socket.on('error', (err: any) => {
			console.log('[WebSocket] (BOT_CLIENT) Socket error');
			if (err) {
				socket.disconnect();
			}
		});

		socket.on('ping', (callback: any) => {
			callback();
		});

		socket.on('disconnect', (reason: string) => {
			console.log(
				`[WebSocket] (BOT_CLIENT) Socket ${socket.id} disconnected. (${reason})`
			);
		});
	} catch (e: unknown) {
		console.log('Error:', e);
	}
});
