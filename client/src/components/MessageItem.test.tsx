import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Message } from '../App';
import { MessageItem } from './MessageItem';

const mockMessage: Message = {
	id: '1',
	content: 'Hello world',
	userId: '1',
	userName: 'Alice',
	userAvatar: 'alice.png',
	timestamp: new Date('2024-01-01T12:00:00Z'),
	reactions: [],
};

describe('MessageItem', () => {
	it('renders message content and user info', () => {
		render(<MessageItem message={mockMessage} showAvatar={true} onAddReaction={() => {}} />);
		expect(screen.getByText('Hello world')).toBeInTheDocument();
		expect(screen.getByText('Alice')).toBeInTheDocument();
		expect(screen.getByAltText('Alice')).toHaveAttribute('src', 'alice.png');
	});

	it('hides avatar when showAvatar is false', () => {
		render(<MessageItem message={mockMessage} showAvatar={false} onAddReaction={() => {}} />);
		expect(screen.queryByAltText('Alice')).not.toBeInTheDocument();
		expect(screen.queryByText('Alice')).not.toBeInTheDocument();
	});

	it('calls onAddReaction when a reaction is clicked', () => {
		const onAddReaction = vi.fn();
		const messageWithReactions: Message = {
			...mockMessage,
			reactions: [{ emoji: '👍', count: 1, users: ['user1'] }],
		};
		render(<MessageItem message={messageWithReactions} showAvatar={true} onAddReaction={onAddReaction} />);
		const reactionButton = screen.getByText('👍').parentElement;
		fireEvent.click(reactionButton!);
		expect(onAddReaction).toHaveBeenCalledWith('1', '👍');
	});

	it('renders mentions correctly', () => {
		const messageWithMention: Message = {
			...mockMessage,
			content: 'Hello @bob',
		};
		render(<MessageItem message={messageWithMention} showAvatar={true} onAddReaction={() => {}} />);
		expect(screen.getByText('@bob')).toBeInTheDocument();
		expect(screen.getByText('@bob')).toHaveClass('text-blue-400');
	});

	it('calls onReply when reply button is clicked', () => {
		const onReply = vi.fn();
		const { container } = render(
			<MessageItem message={mockMessage} showAvatar={true} onAddReaction={() => {}} onReply={onReply} />,
		);

		// Message actions are hidden until hover. We can force setShowActions(true) by hovering
		const containerDiv = container.firstChild as HTMLElement;
		fireEvent.mouseEnter(containerDiv);

		const replyButton = screen.getByTitle('Reply in thread');
		fireEvent.click(replyButton);
		expect(onReply).toHaveBeenCalledWith(mockMessage);
	});

	it('sanitizes dangerous HTML', () => {
		const dangerousMessage: Message = {
			...mockMessage,
			content: '<img src=x onerror=alert("xss") /> <script>alert("xss")</script> [link](javascript:alert("xss"))',
		};
		render(<MessageItem message={dangerousMessage} showAvatar={true} onAddReaction={() => {}} />);

		// The img tag should be stripped or rendered as text (depending on rehype setup, usually stripped)
		// But definitively the onerror handler should be gone.
		// React testing library renders what's in the DOM.
		// If sanitized, the script tag should be gone or safe.

		expect(screen.queryByText('xss')).not.toBeInTheDocument();
		// If it renders as text, it might verify basic text presence but importantly check attribute absence if possible.
		// But simpler: just ensure the raw dangerous string isn't "executed" (hard to test execution in jsdom).
		// We can check that the "onerror" attribute is failing or missing.

		const images = screen.queryAllByRole('img');
		images.forEach((img) => {
			expect(img).not.toHaveAttribute('onerror');
		});
	});
});
