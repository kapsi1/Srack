import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CreateChannelModal } from './CreateChannelModal';

describe('CreateChannelModal', () => {
	it('renders when open', () => {
		render(<CreateChannelModal isOpen={true} onClose={() => {}} onCreate={() => {}} />);
		expect(screen.getByText('Create a channel')).toBeInTheDocument();
	});

	it('does not render when closed', () => {
		render(<CreateChannelModal isOpen={false} onClose={() => {}} onCreate={() => {}} />);
		expect(screen.queryByText('Create a channel')).not.toBeInTheDocument();
	});

	it('calls onCreate with form data', () => {
		const onCreate = vi.fn();
		const onClose = vi.fn();
		render(<CreateChannelModal isOpen={true} onClose={onClose} onCreate={onCreate} />);

		fireEvent.change(screen.getByLabelText('Name'), {
			target: { value: 'new-channel' },
		});
		fireEvent.change(screen.getByLabelText(/Description/), {
			target: { value: 'A cool channel' },
		});

		// Toggle private
		fireEvent.click(screen.getByLabelText('Toggle private'));

		fireEvent.click(screen.getByRole('button', { name: 'Create' }));

		expect(onCreate).toHaveBeenCalledWith('new-channel', true, 'A cool channel');
		expect(onClose).toHaveBeenCalled();
	});

	it('calls onClose when cancel is clicked', () => {
		const onClose = vi.fn();
		render(<CreateChannelModal isOpen={true} onClose={onClose} onCreate={() => {}} />);
		fireEvent.click(screen.getByText('Cancel'));
		expect(onClose).toHaveBeenCalled();
	});
});
