import axios, { type AxiosError } from 'axios';
import { type FormEvent, useState } from 'react';

interface User {
	id: string;
	email: string;
	username: string;
	avatar?: string;
}

interface AuthPageProps {
	onLogin: (user: User, token: string) => void;
}

const API_BASE_URL = 'http://localhost:3001';

const Poops = () => {
	const poops = Array.from({ length: 3 });
	return (
		<span className="relative inline-block">
			<span className="sparkle-text">Srack</span>
			{poops.map((_, i) => (
				<span
					key={`poop-${i}-${Math.random()}`}
					className="absolute poop-emoji pointer-events-none"
					style={{
						top: `${Math.random() * 100 - 20}%`,
						left: `${Math.random() * 140 - 20}%`,
						fontSize: '0.6em',
						animationDelay: `${Math.random() * 2}s`,
						animationDuration: `${1.5 + Math.random()}s`,
					}}
				>
					💩
				</span>
			))}
		</span>
	);
};

export function AuthPage({ onLogin }: AuthPageProps) {
	const [isLogin, setIsLogin] = useState(true);
	const [username, setUsername] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		setError('');
		setLoading(true);

		try {
			const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
			const data = isLogin ? { email, password } : { email, username, password };

			const response = await axios.post(`${API_BASE_URL}${endpoint}`, data);
			const { user, token } = response.data;
			onLogin(user, token);
		} catch (err) {
			const axiosError = err as AxiosError<{ error: string }>;
			console.error('Auth error:', axiosError);
			setError(axiosError.response?.data?.error || 'Authentication failed. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	const toggleMode = () => {
		setIsLogin(!isLogin);
		setError('');
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-[#0d0c0f] px-4">
			<div className="w-full max-w-md">
				{/* Header */}
				<div className="text-center mb-8">
					<div className="bg-[#611f69] mb-4 rounded-xl flex items-center justify-center h-48 overflow-hidden">
						<span style={{ fontSize: '100px', transform: 'translateY(-8px)' }}>💩</span>
					</div>
					<h1 className="text-3xl font-bold text-white mb-2">
						{isLogin ? (
							<>
								Welcome to <Poops />
							</>
						) : (
							'Create your account'
						)}
					</h1>
					<div className="text-gray-400">
						{isLogin ? (
							<div>
								Enter your credentials to continue
								<br />
								Demo user: <span className="font-bold">demo@example.com/password123</span>
							</div>
						) : (
							'Get started with your new workspace'
						)}
					</div>
				</div>

				{/* Form */}
				<div className="bg-[#19171d] rounded-lg p-8 shadow-2xl border border-gray-800">
					{error && (
						<div className="mb-4 p-3 rounded bg-red-500/10 border border-red-500/50 text-red-500 text-sm text-center">
							{error}
						</div>
					)}

					<form onSubmit={handleSubmit} className="space-y-5">
						{!isLogin && (
							<div>
								<label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
									Username
								</label>
								<input
									id="username"
									type="text"
									value={username}
									onChange={(e) => setUsername(e.target.value)}
									className="w-full px-4 py-3 bg-[#0d0c0f] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#611f69] focus:border-transparent transition-all"
									placeholder="Enter your username"
									required={!isLogin}
								/>
							</div>
						)}

						<div>
							<label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
								Email address
							</label>
							<input
								id="email"
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								className="w-full px-4 py-3 bg-[#0d0c0f] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#611f69] focus:border-transparent transition-all"
								placeholder="name@example.com"
								required
							/>
						</div>

						<div>
							<label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
								Password
							</label>
							<input
								id="password"
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								className="w-full px-4 py-3 bg-[#0d0c0f] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#611f69] focus:border-transparent transition-all"
								placeholder="Enter your password"
								required
							/>
						</div>

						<button
							type="submit"
							disabled={loading}
							className="w-full bg-[#611f69] hover:bg-[#4a1850] disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg transition-colors duration-200 font-medium"
						>
							{loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
						</button>
					</form>

					{/* Toggle between login and register */}
					<div className="mt-6 text-center">
						<button type="button" onClick={toggleMode} className="text-[#1d9bd1] hover:underline text-sm">
							{isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
