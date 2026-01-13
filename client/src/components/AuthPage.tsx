import { useState } from "react";

interface AuthPageProps {
	onLogin: (username: string, email: string) => void;
}

export function AuthPage({ onLogin }: AuthPageProps) {
	const [isLogin, setIsLogin] = useState(true);
	const [username, setUsername] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (username.trim() && email.trim() && password.trim()) {
			onLogin(username.trim(), email.trim());
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-[#0d0c0f] px-4">
			<div className="w-full max-w-md">
				{/* Header */}
				<div className="text-center mb-8">
					<div
						className="bg-[#611f69] mb-4 rounded-xl"
						style={{ fontSize: "10em" }}
					>
						💩
					</div>
					<h1 className="text-3xl font-bold text-white mb-2">
						{isLogin ? "Welcome to Srack" : "Create your account"}
					</h1>
					<div className="text-gray-400">
						{isLogin ? (
							<div>
								Enter your credentials to continue
								<br />
								Demo user:{" "}
								<span className="font-bold">demo@example.com/password123</span>
							</div>
						) : (
							"Get started with your new workspace"
						)}
					</div>
				</div>

				{/* Form */}
				<div className="bg-[#19171d] rounded-lg p-8 shadow-2xl border border-gray-800">
					<form onSubmit={handleSubmit} className="space-y-5">
						<div>
							<label
								htmlFor="username"
								className="block text-sm font-medium text-gray-300 mb-2"
							>
								Username
							</label>
							<input
								id="username"
								type="text"
								value={username}
								onChange={(e) => setUsername(e.target.value)}
								className="w-full px-4 py-3 bg-[#0d0c0f] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#611f69] focus:border-transparent transition-all"
								placeholder="Enter your username"
								required
							/>
						</div>

						<div>
							<label
								htmlFor="email"
								className="block text-sm font-medium text-gray-300 mb-2"
							>
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
							<label
								htmlFor="password"
								className="block text-sm font-medium text-gray-300 mb-2"
							>
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
							className="w-full bg-[#611f69] hover:bg-[#4a1850] text-white py-3 px-4 rounded-lg transition-colors duration-200 font-medium"
						>
							{isLogin ? "Sign In" : "Create Account"}
						</button>
					</form>

					{/* Toggle between login and register */}
					<div className="mt-6 text-center">
						<button
							onClick={() => setIsLogin(!isLogin)}
							className="text-[#1d9bd1] hover:underline text-sm"
						>
							{isLogin
								? "Don't have an account? Sign up"
								: "Already have an account? Sign in"}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
