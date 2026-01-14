import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Message } from '../App';
import { ThreadView } from './ThreadView';

const mockParent: Message = {
	id: '1',
	content: 'Parent message',
	userName: 'Alice',
	userId: 'user1',
	userAvatar: 'alice.png',
	timestamp: new Date('2024-01-01T12:00:00Z'),
};

const mockReplies: Message[] = [
	{
		id: '2',
		content: 'Reply 1',
		userName: 'Bob',
		userId: 'user2',
		userAvatar: 'bob.png',
		timestamp: new Date('2024-01-01T12:05:01Z'),
	},
];

describe('ThreadView', () => {
	beforeEach(() => {
		window.HTMLElement.prototype.scrollIntoView = vi.fn();
	});

	it('renders parent message and replies', () => {
		render(
			<ThreadView
				parentMessage={mockParent}
				replies={mockReplies}
				onClose={() => {}}
				onSendMessage={() => {}}
				onAddReaction={() => {}}
				onToggleSave={() => {}}
			/>,
		);
		expect(screen.getByText('Parent message')).toBeInTheDocument();
		expect(screen.getByText('Reply 1')).toBeInTheDocument();
		expect(screen.getByText('1 replies')).toBeInTheDocument();
	});

	it('renders thread header', () => {
		render(
			<ThreadView
				parentMessage={mockParent}
				replies={[]}
				onClose={() => {}}
				onSendMessage={() => {}}
				onAddReaction={() => {}}
				onToggleSave={() => {}}
			/>,
		);
		expect(screen.getByText('Thread')).toBeInTheDocument();
	});
});
