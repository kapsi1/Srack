import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AuthPage } from "./AuthPage";
import { describe, it, expect, vi } from "vitest";
import api from "@/lib/api";

// Mock the API module
vi.mock("@/lib/api", () => ({
	default: {
		post: vi.fn(),
	},
}));

describe("AuthPage", () => {
	it("renders login form by default", () => {
		render(<AuthPage onLogin={() => {}} />);
		expect(screen.getByText(/Welcome to/i)).toBeInTheDocument();
		expect(screen.getByText(/Snack/i)).toBeInTheDocument();
		expect(screen.getByPlaceholderText("name@example.com")).toBeInTheDocument();
		expect(screen.getByPlaceholderText("Enter your password")).toBeInTheDocument();
		expect(screen.queryByPlaceholderText("Enter your username")).not.toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Sign In" })).toBeInTheDocument();
	});

	it("toggles to register form", () => {
		render(<AuthPage onLogin={() => {}} />);
		const toggleButton = screen.getByText("Don't have an account? Sign up");
		fireEvent.click(toggleButton);
		
		expect(screen.getByText("Create your account")).toBeInTheDocument();
		expect(screen.getByPlaceholderText("Enter your username")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Create Account" })).toBeInTheDocument();
	});

	it("submits login form and calls onLogin", async () => {
		const onLogin = vi.fn();
		const mockResponse = {
			data: {
				user: { id: "1", username: "testuser", email: "test@example.com" },
				token: "fake-token",
			},
		};
		(api.post as any).mockResolvedValue(mockResponse);

		render(<AuthPage onLogin={onLogin} />);
		
		fireEvent.change(screen.getByPlaceholderText("name@example.com"), {
			target: { value: "test@example.com" },
		});
		fireEvent.change(screen.getByPlaceholderText("Enter your password"), {
			target: { value: "password123" },
		});
		
		fireEvent.click(screen.getByRole("button", { name: "Sign In" }));
		
		await waitFor(() => {
			expect(api.post).toHaveBeenCalledWith("/auth/login", {
				email: "test@example.com",
				password: "password123",
			});
			expect(onLogin).toHaveBeenCalledWith(mockResponse.data.user, mockResponse.data.token);
		});
	});

	it("shows error message on authentication failure", async () => {
		(api.post as any).mockRejectedValue({
			response: {
				data: { error: "Invalid credentials" },
			},
		});

		render(<AuthPage onLogin={() => {}} />);
		
		fireEvent.change(screen.getByPlaceholderText("name@example.com"), {
			target: { value: "test@example.com" },
		});
		fireEvent.change(screen.getByPlaceholderText("Enter your password"), {
			target: { value: "wrong" },
		});
		
		fireEvent.click(screen.getByRole("button", { name: "Sign In" }));
		
		await waitFor(() => {
			expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
		});
	});
});
