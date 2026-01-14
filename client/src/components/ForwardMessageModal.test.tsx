import { render, screen, fireEvent } from "@testing-library/react";
import { ForwardMessageModal } from "./ForwardMessageModal";
import { describe, it, expect, vi } from "vitest";

const mockMessage = {
	id: "1",
	content: "Forward this",
	userName: "Alice",
	timestamp: new Date("2024-01-01T12:00:00Z"),
} as any;

const mockChannels = [
	{ id: "1", name: "general", type: "PUBLIC" },
	{ id: "2", name: "random", type: "PUBLIC" },
] as any;

describe("ForwardMessageModal", () => {
	it("renders when open and message provided", () => {
		render(
			<ForwardMessageModal
				isOpen={true}
				onClose={() => {}}
				channels={mockChannels}
				message={mockMessage}
				onForward={() => {}}
			/>
		);
		expect(screen.getByText("Forward message")).toBeInTheDocument();
		expect(screen.getByText("Forward this")).toBeInTheDocument();
	});

	it("calls onForward with selected channel id", () => {
		const onForward = vi.fn();
		const onClose = vi.fn();
		render(
			<ForwardMessageModal
				isOpen={true}
				onClose={onClose}
				channels={mockChannels}
				message={mockMessage}
				onForward={onForward}
			/>
		);

		fireEvent.change(screen.getByLabelText("Forward to channel"), {
			target: { value: "2" },
		});

		fireEvent.click(screen.getByRole("button", { name: "Forward" }));

		expect(onForward).toHaveBeenCalledWith("2");
		expect(onClose).toHaveBeenCalled();
	});
});
