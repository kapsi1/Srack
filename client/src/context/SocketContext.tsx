import type React from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { io } from 'socket.io-client';

interface SocketContextType {
	socket: Socket | null;
	isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
	socket: null,
	isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
	const [socket, setSocket] = useState<Socket | null>(null);
	const [isConnected, setIsConnected] = useState(false);

	useEffect(() => {
		// In production, use current origin (proxied by Vercel) for same-origin requests
		// In development, VITE_SOCKET_URL can override to point to local backend
		const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;
		console.log('Final SOCKET_URL configured as:', SOCKET_URL);
		const socketInstance = io(SOCKET_URL, {
			withCredentials: true, // Send cookies for authentication
		});

		socketInstance.on('connect', () => {
			setIsConnected(true);
			console.log('Socket connected');
		});

		socketInstance.on('disconnect', () => {
			setIsConnected(false);
			console.log('Socket disconnected');
		});

		setSocket(socketInstance);

		return () => {
			socketInstance.disconnect();
		};
	}, []);

	return <SocketContext.Provider value={{ socket, isConnected }}>{children}</SocketContext.Provider>;
};
