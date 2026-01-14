import { useQuery } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ThreadsListView } from './ThreadsListView';

// Mock react-query
vi.mock('@tanstack/react-query', () => ({
	useQuery: vi.fn(),
}));

const mockUser = {
	id: '1',
	username: 'testuser',
	email: 'test@example.com',
	avatar: 'avatar.png',
};

const mockThreads = [
	{
		id: '1',
		content: 'Parent message',
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		sender: { username: 'Alice', avatar: 'alice.png' },
		channel: { name: 'general' },
		threadCount: 2,
		replies: [{ id: '2', content: 'Reply 1', sender: { username: 'Bob', avatar: 'bob.png' } }],
	},
];

describe('ThreadsListView', () => {
	it('renders loading state', () => {
		vi.mocked(useQuery).mockReturnValue({ isLoading: true } as any);
		render(<ThreadsListView isSidebarCollapsed={false} onToggleSidebar={() => {}} />);
		expect(screen.getByText('Loading threads...')).toBeInTheDocument();
	});

	it('renders empty state', () => {
		vi.mocked(useQuery).mockReturnValue({ isLoading: false, data: [] } as any);
		render(<ThreadsListView isSidebarCollapsed={false} onToggleSidebar={() => {}} />);
		expect(screen.getByText('No threads yet')).toBeInTheDocument();
	});

	it('renders list of threads', () => {
		vi.mocked(useQuery).mockReturnValue({ isLoading: false, data: mockThreads } as any);
		render(<ThreadsListView isSidebarCollapsed={false} onToggleSidebar={() => {}} />);
		expect(screen.getByText('Parent message')).toBeInTheDocument();
		expect(screen.getByText('#general')).toBeInTheDocument();
		expect(screen.getByText('2 replies')).toBeInTheDocument();
		expect(screen.getByText('Reply 1')).toBeInTheDocument();
	});

	it('calls onOpenThread when a thread is clicked', () => {
		const onOpenThread = vi.fn();
		vi.mocked(useQuery).mockReturnValue({ isLoading: false, data: mockThreads } as any);
		render(<ThreadsListView onOpenThread={onOpenThread} isSidebarCollapsed={false} onToggleSidebar={() => {}} />);

		fireEvent.click(screen.getByText('Parent message'));
		expect(onOpenThread).toHaveBeenCalledWith(mockThreads[0]);
	});
});
