import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchCurrentUser } from '../lib/api';
import type { User } from '../types';

export interface UseAuthReturn {
	currentUser: User | null;
	isLoading: boolean;
	handleLogin: (user: User) => void;
	handleLogout: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
	const [currentUser, setCurrentUser] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const navigate = useNavigate();

	const handleLogout = useCallback(async () => {
		try {
			// Call logout endpoint to clear the cookie
			await fetch(`${import.meta.env.VITE_API_URL || '/api'}/auth/logout`, {
				method: 'POST',
				credentials: 'include',
			});
		} catch (error) {
			console.error('Logout error:', error);
		}
		setCurrentUser(null);
		navigate('/', { replace: true });
	}, [navigate]);

	const handleLogin = useCallback((user: User) => {
		// Token is now set as HttpOnly cookie by the server
		setCurrentUser(user);
	}, []);

	useEffect(() => {
		// Check if we're authenticated by trying to fetch current user
		// The cookie will be sent automatically
		fetchCurrentUser()
			.then((user) => {
				setCurrentUser(user);
			})
			.catch(() => {
				setCurrentUser(null);
			})
			.finally(() => {
				setIsLoading(false);
			});
	}, []);

	return {
		currentUser,
		isLoading,
		handleLogin,
		handleLogout,
	};
}
