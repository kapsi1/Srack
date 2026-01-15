import { API_URL } from './api';

interface LogEntry {
	level: string;
	message: string;
	details?: string;
	userId?: string;
}

const LOG_Queue: LogEntry[] = [];
let flushing = false;

const consumeQueue = async () => {
	if (flushing || LOG_Queue.length === 0) return;
	flushing = true;

	const logsToSend = LOG_Queue.splice(0, 10); // Batch 10 logs

	try {
        for (const log of logsToSend) {
            await fetch(`${API_URL}/logs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify(log),
            });
        }
	} catch (error) {
		console.error('Failed to send logs to server', error);
	} finally {
		flushing = false;
		if (LOG_Queue.length > 0) {
			consumeQueue();
		}
	}
};

export const logToServer = (level: string, message: string, details?: unknown) => {
    // Also log to console
    if (level === 'error') {
        console.error(message, details);
    } else if (level === 'warn') {
        console.warn(message, details);
    } else {
        console.log(message, details);
    }

    // Prepare log object
    const user = localStorage.getItem('user');
    let userId: string | undefined = undefined;
    if (user) {
        try {
            userId = JSON.parse(user).id;
        } catch (_e) {
            // ignore
        }
    }

    const logEntry: LogEntry = {
        level,
        message,
        details: details ? JSON.stringify(details) : undefined,
        userId,
    };

    LOG_Queue.push(logEntry);
    consumeQueue();
};

export const logger = {
    info: (message: string, details?: unknown) => logToServer('info', message, details),
    warn: (message: string, details?: unknown) => logToServer('warn', message, details),
    error: (message: string, details?: unknown) => logToServer('error', message, details),
    debug: (message: string, details?: unknown) => logToServer('debug', message, details),
};
