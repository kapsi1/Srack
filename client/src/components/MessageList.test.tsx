import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Message } from '../App';
import { MessageList } from './MessageList';

const mockMessages: Message[] = [
	{
		id: '1',
		content: 'First message',
		userName: 'Alice',
		userId: 'user1',
		userAvatar: 'alice.png',
		timestamp: new Date('2024-01-01T12:00:00Z'),
	},
	{
		id: '2',
		content: 'Second message',
		userName: 'Bob',
		userId: 'user2',
		userAvatar: 'bob.png',
		timestamp: new Date('2024-01-01T12:05:01Z'),
	},
];

describe('MessageList', () => {
	beforeEach(() => {
		// Mock scrollIntoView
		window.HTMLElement.prototype.scrollIntoView = vi.fn();
	});

	it('renders list of messages', () => {
		render(<MessageList messages={mockMessages} onAddReaction={() => {}} />);
		expect(screen.getByText('First message')).toBeInTheDocument();
		expect(screen.getByText('Second message')).toBeInTheDocument();
	});

	it('renders channel intro when channel is provided', () => {
		render(<MessageList channel={{ name: 'general' }} messages={mockMessages} onAddReaction={() => {}} />);
		expect(screen.getByText('general')).toBeInTheDocument();
		expect(screen.getByText(/This is the very beginning/)).toBeInTheDocument();
	});

	it('does not render channel intro for DM channels', () => {
		render(<MessageList channel={{ name: 'dm-123', type: 'DM' }} messages={mockMessages} onAddReaction={() => {}} />);
		expect(screen.queryByText('dm-123')).not.toBeInTheDocument();
		expect(screen.queryByText(/This is the very beginning/)).not.toBeInTheDocument();
	});

	it('groups messages by user within 5 minutes', () => {
		const sameUserMessages: Message[] = [
			{
				id: '1',
				content: 'Message 1',
				userName: 'Alice',
				userId: 'user1',
				userAvatar: 'alice.png',
				timestamp: new Date('2024-01-01T12:00:00Z'),
			},
			{
				id: '2',
				content: 'Message 2',
				userName: 'Alice',
				userId: 'user1',
				userAvatar: 'alice.png',
				timestamp: new Date('2024-01-01T12:01:00Z'), // 1 min later
			},
		];

		render(<MessageList messages={sameUserMessages} onAddReaction={() => {}} />);

		// Alice should only appear once as a heading (in MessageItem, showAvatar is true for the first one)
		const usernames = screen.getAllByText('Alice');
		expect(usernames.length).toBe(1);
	});

	it('shows avatar for same user after 5 minutes', () => {
		const sameUserMessages: Message[] = [
			{
				id: '1',
				content: 'Message 1',
				userName: 'Alice',
				userId: 'user1',
				userAvatar: 'alice.png',
				timestamp: new Date('2024-01-01T12:00:00Z'),
			},
			{
				id: '2',
				content: 'Message 2',
				userName: 'Alice',
				userId: 'user1',
				userAvatar: 'alice.png',
				timestamp: new Date('2024-01-01T12:06:00Z'), // 6 mins later
			},
		];

		render(<MessageList messages={sameUserMessages} onAddReaction={() => {}} />);

		// Alice should appear twice
		const usernames = screen.getAllByText('Alice');
		expect(usernames.length).toBe(2);
	});
});
