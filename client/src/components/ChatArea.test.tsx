import { render, screen, fireEvent } from "@testing-library/react";
import { ChatArea } from "./ChatArea";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Channel, Message, User } from "../App";

const mockUser: User = {
	id: "1",
	username: "testuser",
	email: "test@example.com",
    avatar: "avatar.png"
};

const mockChannel: Channel = {
    id: "1",
    name: "general",
    type: "PUBLIC",
    isPrivate: false,
    members: []
};

const mockMessages: Message[] = [
	{
		id: "1",
		content: "First message",
		userName: "Alice",
		userId: "user2",
		userAvatar: "alice.png",
		timestamp: new Date("2024-01-01T12:00:00Z"),
	},
];

describe("ChatArea", () => {
    beforeEach(() => {
        window.HTMLElement.prototype.scrollIntoView = vi.fn();
    });

	it("renders channel name", () => {
		render(
			<ChatArea
				channel={mockChannel}
				currentUser={mockUser}
				messages={mockMessages}
				onSendMessage={() => {}}
				onAddReaction={() => {}}
				onToggleSave={() => {}}
				onToggleRightSidebar={() => {}}
				isSidebarCollapsed={false}
				onToggleSidebar={() => {}}
			/>
		);
		expect(screen.getAllByText("general").length).toBeGreaterThan(0);
	});

    it("filters messages when searching", () => {
        const messages = [
            ...mockMessages,
            { id: "2", content: "Secret", userName: "Bob", userId: "user3", timestamp: new Date() }
        ] as Message[];

		render(
			<ChatArea
				channel={mockChannel}
				currentUser={mockUser}
				messages={messages}
				onSendMessage={() => {}}
				onAddReaction={() => {}}
				onToggleSave={() => {}}
				onToggleRightSidebar={() => {}}
				isSidebarCollapsed={false}
				onToggleSidebar={() => {}}
			/>
		);
		
        expect(screen.getByText("First message")).toBeInTheDocument();
        expect(screen.getByText("Secret")).toBeInTheDocument();

        // Open search
        const searchButton = screen.getByTitle("Search messages");
        fireEvent.click(searchButton);

        const searchInput = screen.getByPlaceholderText("Search...");
        fireEvent.change(searchInput, { target: { value: "Secret" } });

        expect(screen.queryByText("First message")).not.toBeInTheDocument();
        expect(screen.getByText("Secret")).toBeInTheDocument();
	});

    it("calls onToggleRightSidebar when info button is clicked", () => {
        const onToggleRightSidebar = vi.fn();
		render(
			<ChatArea
				channel={mockChannel}
				currentUser={mockUser}
				messages={mockMessages}
				onSendMessage={() => {}}
				onAddReaction={() => {}}
				onToggleSave={() => {}}
				onToggleRightSidebar={onToggleRightSidebar}
				isSidebarCollapsed={false}
				onToggleSidebar={() => {}}
			/>
		);
		const infoButton = screen.getByTitle("Show details");
        fireEvent.click(infoButton);
        expect(onToggleRightSidebar).toHaveBeenCalled();
	});
});
