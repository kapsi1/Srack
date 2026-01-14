import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Channel, User } from '../App';
import { ChannelInfo } from './ChannelInfo';

const mockUser: User = {
	id: '1',
	username: 'testuser',
	email: 'test@example.com',
	avatar: 'avatar.png',
};

const mockChannel = {
	id: '1',
	name: 'general',
	type: 'PUBLIC',
	isPrivate: false,
	members: [
		{ id: '1', username: 'testuser', email: 'test@example.com' },
		{ id: '2', username: 'Alice', email: 'alice@example.com' },
	],
} as unknown as Channel;

describe('ChannelInfo', () => {
	it('renders channel name and members', () => {
		render(<ChannelInfo channel={mockChannel} currentUser={mockUser} onClose={() => {}} />);
		expect(screen.getByText('general')).toBeInTheDocument();
		expect(screen.getByText('Alice')).toBeInTheDocument();
		expect(screen.getByText('testuser')).toBeInTheDocument();
		expect(screen.getByText('(you)')).toBeInTheDocument();
	});

	it('renders user info for DM channels', () => {
		const dmChannel = {
			id: '2',
			type: 'DM',
			members: [{ id: '3', username: 'Bob', email: 'bob@example.com' }],
		} as unknown as Channel;

		render(<ChannelInfo channel={dmChannel} currentUser={mockUser} onClose={() => {}} />);
		expect(screen.getAllByText('Bob').length).toBeGreaterThan(0);
		expect(screen.getByText('bob@example.com')).toBeInTheDocument();
	});

	it('calls onClose when close button is clicked', () => {
		const onClose = vi.fn();
		render(<ChannelInfo channel={mockChannel} currentUser={mockUser} onClose={onClose} />);
		// The one with X icon
		// Find by svg/icon or just the button. It's the only other button in header.
		fireEvent.click(screen.getAllByRole('button')[0]); // First button is close button
		expect(onClose).toHaveBeenCalled();
	});
});
