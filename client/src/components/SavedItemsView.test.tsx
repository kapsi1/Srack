import { render, screen, fireEvent } from "@testing-library/react";
import { SavedItemsView } from "./SavedItemsView";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Message, User } from "../App";

const mockUser: User = {
	id: "1",
	username: "testuser",
	email: "test@example.com",
    avatar: "avatar.png"
};

const mockMessages: Message[] = [
	{
		id: "1",
		content: "Saved message",
		userName: "Alice",
		userId: "user1",
		userAvatar: "alice.png",
		timestamp: new Date("2024-01-01T12:00:00Z"),
        isSaved: true
	},
];

describe("SavedItemsView", () => {
    beforeEach(() => {
        window.HTMLElement.prototype.scrollIntoView = vi.fn();
    });

	it("renders empty state when no messages", () => {
		render(
			<SavedItemsView
				currentUser={mockUser}
				messages={[]}
				onAddReaction={() => {}}
				onToggleSave={() => {}}
				isSidebarCollapsed={false}
				onToggleSidebar={() => {}}
			/>
		);
		expect(screen.getByText("Nothing saved yet")).toBeInTheDocument();
	});

	it("renders saved messages", () => {
		render(
			<SavedItemsView
				currentUser={mockUser}
				messages={mockMessages}
				onAddReaction={() => {}}
				onToggleSave={() => {}}
				isSidebarCollapsed={false}
				onToggleSidebar={() => {}}
			/>
		);
		expect(screen.getByText("Saved message")).toBeInTheDocument();
	});

    it("renders sidebar toggle when collapsed", () => {
        const onToggleSidebar = vi.fn();
		render(
			<SavedItemsView
				currentUser={mockUser}
				messages={[]}
				onAddReaction={() => {}}
				onToggleSave={() => {}}
				isSidebarCollapsed={true}
				onToggleSidebar={onToggleSidebar}
			/>
		);
		const toggleButton = screen.getByTitle("Show sidebar");
        fireEvent.click(toggleButton);
        expect(onToggleSidebar).toHaveBeenCalled();
	});
});
