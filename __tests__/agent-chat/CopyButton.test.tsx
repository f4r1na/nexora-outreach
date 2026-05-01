import { render, screen, waitFor } from '@testing-library/react';
import { act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CopyButton } from '@/app/dashboard/agent/_components/CopyButton';

describe('CopyButton', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: jest.fn().mockResolvedValue(undefined) },
      writable: true,
      configurable: true,
    });
  });

  it('renders with "Copy message" aria-label', () => {
    render(<CopyButton text="hello" />);
    expect(screen.getByRole('button', { name: 'Copy message' })).toBeInTheDocument();
  });

  it('calls clipboard.writeText with the provided text', async () => {
    render(<CopyButton text="test content" />);
    await userEvent.click(screen.getByRole('button', { name: 'Copy message' }));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test content');
  });

  it('changes aria-label to "Message copied" after copy', async () => {
    render(<CopyButton text="hello" />);
    await userEvent.click(screen.getByRole('button', { name: 'Copy message' }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Message copied' })).toBeInTheDocument();
    });
  });

  it('reverts aria-label to "Copy message" after 2000ms', async () => {
    render(<CopyButton text="hello" />);
    await userEvent.click(screen.getByRole('button', { name: 'Copy message' }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Message copied' })).toBeInTheDocument();
    });
    // Wait 2100ms for the timeout to fire and state to revert
    await act(async () => {
      await new Promise(r => setTimeout(r, 2100));
    });
    expect(screen.getByRole('button', { name: 'Copy message' })).toBeInTheDocument();
  });
});
