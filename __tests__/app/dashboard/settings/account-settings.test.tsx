import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard/settings/account',
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
}));

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(),
}));

// ─── Imports ──────────────────────────────────────────────────────────────────

import { createClient } from '@/lib/supabase/client';
import AccountPage from '@/app/dashboard/settings/account/page';
import PrefsPage from '@/app/dashboard/settings/preferences/page';

// ─── Mock wiring ──────────────────────────────────────────────────────────────

const mockGetUser = jest.fn();
const mockUpdateUser = jest.fn();

const mockSupabaseClient = {
  auth: { getUser: mockGetUser, updateUser: mockUpdateUser },
  storage: {
    from: () => ({
      upload: jest.fn().mockResolvedValue({ error: null }),
      getPublicUrl: jest.fn().mockReturnValue({
        data: { publicUrl: 'https://example.com/avatar.png' },
      }),
    }),
  },
};

(createClient as jest.Mock).mockReturnValue(mockSupabaseClient);

function mockAuthUser(metadata: Record<string, unknown> = {}) {
  mockGetUser.mockResolvedValue({
    data: {
      user: { id: 'user-123', email: 'test@example.com', user_metadata: metadata },
    },
  });
}

function mockProfileFetch(overrides: Record<string, unknown> = {}) {
  (global.fetch as jest.Mock).mockResolvedValue({
    ok: true,
    json: async () => ({
      profile: {
        full_name: 'Jane Doe',
        avatar_url: null,
        company_name: '',
        website_url: '',
        company_description: '',
        role: '',
        icp_industries: '',
        icp_company_size: 'all',
        icp_location: '',
        ...overrides,
      },
      email: 'test@example.com',
    }),
  });
}

// ─── Account Settings Page ────────────────────────────────────────────────────

describe('Account Settings Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockReturnValue(mockSupabaseClient);
    mockUpdateUser.mockResolvedValue({ error: null });
    global.fetch = jest.fn();
    mockAuthUser();
    mockProfileFetch();
  });

  it('renders the page heading', async () => {
    render(<AccountPage />);
    await waitFor(() => {
      expect(screen.getByText('Account Settings')).toBeInTheDocument();
    });
  });

  it('renders the three section headers after data loads', async () => {
    render(<AccountPage />);
    await waitFor(() => {
      expect(screen.getByText('Personal Information')).toBeInTheDocument();
    });
    expect(screen.getByText('Company Profile')).toBeInTheDocument();
    expect(screen.getByText('ICP (Ideal Customer Profile)')).toBeInTheDocument();
  });

  it('populates full_name from profile API', async () => {
    mockProfileFetch({ full_name: 'Alice Smith' });
    render(<AccountPage />);
    await waitFor(() => {
      const inputs = screen.getAllByRole('textbox');
      const values = inputs.map((i) => (i as HTMLInputElement).value);
      expect(values).toContain('Alice Smith');
    });
  });

  it('populates company_name from profile API', async () => {
    mockProfileFetch({ full_name: 'Jane Doe', company_name: 'Acme Corp' });
    render(<AccountPage />);
    await waitFor(() => {
      const inputs = screen.getAllByRole('textbox');
      const values = inputs.map((i) => (i as HTMLInputElement).value);
      expect(values).toContain('Acme Corp');
    });
  });

  it('renders the Save Changes button', async () => {
    render(<AccountPage />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
    });
  });

  it('calls PATCH /api/profile when Save Changes is clicked', async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockImplementation((url: string, opts?: RequestInit) => {
      if (opts?.method === 'PATCH') {
        return Promise.resolve({ ok: true, json: async () => ({}) });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({
          profile: { full_name: 'Jane Doe', avatar_url: null, company_name: '', website_url: '', company_description: '', role: '', icp_industries: '', icp_company_size: 'all', icp_location: '' },
          email: 'test@example.com',
        }),
      });
    });

    render(<AccountPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      const calls = (global.fetch as jest.Mock).mock.calls as [string, RequestInit][];
      const patchCall = calls.find(([url, opts]) => url === '/api/profile' && opts?.method === 'PATCH');
      expect(patchCall).toBeDefined();
    });
  });

  it('shows Saving... inside button while request is in flight', async () => {
    const user = userEvent.setup();
    let resolvePatch!: () => void;
    (global.fetch as jest.Mock).mockImplementation((url: string, opts?: RequestInit) => {
      if (opts?.method === 'PATCH') {
        return new Promise<Response>((resolve) => {
          resolvePatch = () =>
            resolve({ ok: true, json: async () => ({}) } as Response);
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({
          profile: { full_name: 'Jane Doe', avatar_url: null, company_name: '', website_url: '', company_description: '', role: '', icp_industries: '', icp_company_size: 'all', icp_location: '' },
          email: 'test@example.com',
        }),
      });
    });

    render(<AccountPage />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /save changes/i }));

    // While in flight the button should say "Saving..."
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /saving/i })).toBeInTheDocument();
    });

    // Resolve and clean up
    await act(async () => { resolvePatch(); });
  });
});

// ─── Preferences Settings Page ────────────────────────────────────────────────

describe('Preferences Settings Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockReturnValue(mockSupabaseClient);
    mockUpdateUser.mockResolvedValue({ error: null });
    mockAuthUser({ pref_timezone: 'America/New_York' });
  });

  it('renders the Preferences heading', async () => {
    render(<PrefsPage />);
    await waitFor(() => {
      expect(screen.getByText('Preferences')).toBeInTheDocument();
    });
  });

  it('renders all three section headers', async () => {
    render(<PrefsPage />);
    await waitFor(() => {
      expect(screen.getByText('Email Writing Style')).toBeInTheDocument();
    });
    expect(screen.getByText('Signal Preferences')).toBeInTheDocument();
    expect(screen.getByText('Default Campaign Settings')).toBeInTheDocument();
  });

  it('renders the Professional tone preview by default', async () => {
    render(<PrefsPage />);
    await waitFor(() => {
      expect(
        screen.getByText(/I noticed you recently hired a VP of Engineering/)
      ).toBeInTheDocument();
    });
  });

  it('saves signal_show_urls when checkbox is toggled', async () => {
    const user = userEvent.setup();
    render(<PrefsPage />);

    await waitFor(() => {
      expect(screen.getByText('Show source URLs on signals')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('checkbox'));

    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ signal_show_urls: expect.any(Boolean) }),
        })
      );
    });
  });

  it('shows validation error when follow-up delay is cleared and blurred', async () => {
    const user = userEvent.setup();
    // Start with an empty followup_delay_1 so the blur handler sees invalid state immediately
    mockAuthUser({ pref_timezone: 'America/New_York', followup_delay_1: '' });
    render(<PrefsPage />);

    await waitFor(() => {
      expect(screen.getByText('Default Campaign Settings')).toBeInTheDocument();
    });

    const numberInputs = screen.getAllByRole('spinbutton');
    const firstInput = numberInputs[0];

    await user.click(firstInput);
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText('Enter a number between 1 and 30')).toBeInTheDocument();
    });
  });

  it('shows validation error for out-of-range follow-up delay', async () => {
    const user = userEvent.setup();
    // Start with an out-of-range followup_delay_1 so blur handler sees invalid state immediately
    mockAuthUser({ pref_timezone: 'America/New_York', followup_delay_1: '99' });
    render(<PrefsPage />);

    await waitFor(() => {
      expect(screen.getByText('Default Campaign Settings')).toBeInTheDocument();
    });

    const numberInputs = screen.getAllByRole('spinbutton');
    const firstInput = numberInputs[0];

    await user.click(firstInput);
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText('Enter a number between 1 and 30')).toBeInTheDocument();
    });
  });
});
