import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import type { Channel, DirectMessage, User } from '../App';
import { Sidebar } from './Sidebar';

const mockUser: User = {
	id: '1',
	username: 'Test User',
	avatar: 'avatar.png',
	email: 'test@example.com',
};

const mockChannels: Channel[] = [
	{ id: '1', name: 'general', type: 'PUBLIC', isPrivate: false, members: [] },
	{ id: '2', name: 'random', type: 'PUBLIC', isPrivate: false, members: [] },
];

const mockDMs: DirectMessage[] = [];

describe('Sidebar', () => {
	it('renders user name', () => {
		render(
			<MemoryRouter>
				<Sidebar
					channels={mockChannels}
					directMessages={mockDMs}
					activeChannel={mockChannels[0]}
					currentUser={mockUser}
					onLogout={() => {}}
					onAddChannel={() => {}}
					isCollapsed={false}
					onToggleCollapse={() => {}}
				/>
			</MemoryRouter>,
		);
		expect(screen.getByText('Test User')).toBeInTheDocument();
	});

	it('renders channels', () => {
		render(
			<MemoryRouter>
				<Sidebar
					channels={mockChannels}
					directMessages={mockDMs}
					activeChannel={mockChannels[0]}
					currentUser={mockUser}
					onLogout={() => {}}
					onAddChannel={() => {}}
					isCollapsed={false}
					onToggleCollapse={() => {}}
				/>
			</MemoryRouter>,
		);
		expect(screen.getByText('general')).toBeInTheDocument();
		expect(screen.getByText('random')).toBeInTheDocument();
	});

	it('calls onLogout when logout icon is clicked', () => {
		const handleLogout = vi.fn();
		render(
			<MemoryRouter>
				<Sidebar
					channels={mockChannels}
					directMessages={mockDMs}
					activeChannel={mockChannels[0]}
					currentUser={mockUser}
					onLogout={handleLogout}
					onAddChannel={() => {}}
					isCollapsed={false}
					onToggleCollapse={() => {}}
				/>
			</MemoryRouter>,
		);
	});
});
