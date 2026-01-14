import { render, screen, fireEvent } from "@testing-library/react";
import { ChannelInfo } from "./ChannelInfo";
import { describe, it, expect, vi } from "vitest";

const mockUser = {
	id: "1",
	username: "testuser",
	email: "test@example.com",
    avatar: "avatar.png"
};

const mockChannel = {
    id: "1",
    name: "general",
    type: "PUBLIC",
    isPrivate: false,
    members: [
        { id: "1", username: "testuser", email: "test@example.com" },
        { id: "2", username: "Alice", email: "alice@example.com" }
    ]
} as any;

describe("ChannelInfo", () => {
	it("renders channel name and members", () => {
		render(
			<ChannelInfo
				channel={mockChannel}
				currentUser={mockUser}
				onClose={() => {}}
			/>
		);
		expect(screen.getByText("general")).toBeInTheDocument();
		expect(screen.getByText("Alice")).toBeInTheDocument();
		expect(screen.getByText("testuser")).toBeInTheDocument();
		expect(screen.getByText("(you)")).toBeInTheDocument();
	});

    it("renders user info for DM channels", () => {
        const dmChannel = {
            id: "2",
            type: "DM",
            members: [
                { id: "1", username: "testuser", email: "test@example.com" },
                { id: "3", username: "Bob", email: "bob@example.com" }
            ]
        } as any;

		render(
			<ChannelInfo
				channel={dmChannel}
				currentUser={mockUser}
				onClose={() => {}}
			/>
		);
		expect(screen.getAllByText("Bob").length).toBeGreaterThan(0);
		expect(screen.getByText("bob@example.com")).toBeInTheDocument();
	});

    it("calls onClose when close button is clicked", () => {
        const onClose = vi.fn();
		render(
			<ChannelInfo
				channel={mockChannel}
				currentUser={mockUser}
				onClose={onClose}
			/>
		);
		const closeButton = screen.getByRole("button", { name: "" }); // The one with X icon
        // Find by svg/icon or just the button. It's the only other button in header.
        fireEvent.click(screen.getAllByRole("button")[0]); // First button is close button
        expect(onClose).toHaveBeenCalled();
	});
});
