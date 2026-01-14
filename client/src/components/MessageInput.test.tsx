import { render, screen } from "@testing-library/react";
import { MessageInput } from "./MessageInput";
import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";

describe("MessageInput", () => {
	it("renders input with correct placeholder", () => {
		render(<MessageInput channelName="general" onSendMessage={() => {}} />);
		expect(screen.getByPlaceholderText("Message #general")).toBeInTheDocument();

		render(
			<MessageInput
				channelName="userValue"
				isDM={true}
				onSendMessage={() => {}}
			/>,
		);
		expect(
			screen.getByPlaceholderText("Message @userValue"),
		).toBeInTheDocument();
	});

	it("input field works", async () => {
		const user = userEvent.setup();
		render(<MessageInput channelName="general" onSendMessage={() => {}} />);

		const input = screen.getByPlaceholderText("Message #general");
		await user.type(input, "Hello World");

		expect(input).toHaveValue("Hello World");
	});

	it("sends message and clears input using Enter key", async () => {
		const handleSend = vi.fn();
		const user = userEvent.setup();
		render(<MessageInput channelName="general" onSendMessage={handleSend} />);

		const input = screen.getByPlaceholderText("Message #general");
		await user.type(input, "Hello World");
		await user.keyboard("{Enter}");

		expect(handleSend).toHaveBeenCalledWith("Hello World");
		expect(input).toHaveValue("");
	});

	it("formatting buttons work (Bold)", async () => {
		// Formatting relies on selection APIs which might need mocking or specific environment configuration in JSDOM usually they work basically.
		const user = userEvent.setup();
		render(<MessageInput channelName="general" onSendMessage={() => {}} />);
		const input = screen.getByPlaceholderText("Message #general");

		await user.type(input, "test");
		// Cursor is at end

		const boldBtn = screen.getByTitle("Bold");
		await user.click(boldBtn);

		// logic: before + format + selection + format + after
		// if selection empty: before + format + format + after
		// 'test' + '**' + '' + '**' -> 'test****'
		expect(input).toHaveValue("test****");
	});
});
