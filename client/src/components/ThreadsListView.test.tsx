import { render, screen, fireEvent } from "@testing-library/react";
import { ThreadsListView } from "./ThreadsListView";
import { describe, it, expect, vi } from "vitest";
import { useQuery } from "@tanstack/react-query";

// Mock react-query
vi.mock("@tanstack/react-query", () => ({
	useQuery: vi.fn(),
}));

const mockUser = {
	id: "1",
	username: "testuser",
	email: "test@example.com",
    avatar: "avatar.png"
};

const mockThreads = [
	{
		id: "1",
		content: "Parent message",
		createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
		sender: { username: "Alice", avatar: "alice.png" },
		channel: { name: "general" },
		threadCount: 2,
		replies: [
			{ id: "2", content: "Reply 1", sender: { username: "Bob", avatar: "bob.png" } }
		]
	},
];

describe("ThreadsListView", () => {
	it("renders loading state", () => {
		(useQuery as any).mockReturnValue({ isLoading: true });
		render(
			<ThreadsListView
				currentUser={mockUser}
				isSidebarCollapsed={false}
				onToggleSidebar={() => {}}
			/>
		);
		expect(screen.getByText("Loading threads...")).toBeInTheDocument();
	});

	it("renders empty state", () => {
		(useQuery as any).mockReturnValue({ isLoading: false, data: [] });
		render(
			<ThreadsListView
				currentUser={mockUser}
				isSidebarCollapsed={false}
				onToggleSidebar={() => {}}
			/>
		);
		expect(screen.getByText("No threads yet")).toBeInTheDocument();
	});

	it("renders list of threads", () => {
		(useQuery as any).mockReturnValue({ isLoading: false, data: mockThreads });
		render(
			<ThreadsListView
				currentUser={mockUser}
				isSidebarCollapsed={false}
				onToggleSidebar={() => {}}
			/>
		);
		expect(screen.getByText("Parent message")).toBeInTheDocument();
		expect(screen.getByText("#general")).toBeInTheDocument();
		expect(screen.getByText("2 replies")).toBeInTheDocument();
		expect(screen.getByText("Reply 1")).toBeInTheDocument();
	});

	it("calls onOpenThread when a thread is clicked", () => {
		const onOpenThread = vi.fn();
		(useQuery as any).mockReturnValue({ isLoading: false, data: mockThreads });
		render(
			<ThreadsListView
				currentUser={mockUser}
				onOpenThread={onOpenThread}
				isSidebarCollapsed={false}
				onToggleSidebar={() => {}}
			/>
		);
		
		fireEvent.click(screen.getByText("Parent message"));
		expect(onOpenThread).toHaveBeenCalledWith(mockThreads[0]);
	});
});
