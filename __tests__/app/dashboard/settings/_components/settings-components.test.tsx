import React from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard/settings/account',
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
}));

import SectionHeader from '@/app/dashboard/settings/_components/SectionHeader';
import SaveStatus from '@/app/dashboard/settings/_components/SaveStatus';
import FormInput from '@/app/dashboard/settings/_components/FormInput';
import FormCheckbox from '@/app/dashboard/settings/_components/FormCheckbox';
import FormSelect from '@/app/dashboard/settings/_components/FormSelect';

// ─── SectionHeader ────────────────────────────────────────────────────────────

describe('SectionHeader', () => {
  it('renders the title', () => {
    render(<SectionHeader title="Personal Information" />);
    expect(screen.getByText('Personal Information')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(<SectionHeader title="Profile" description="Update your profile details" />);
    expect(screen.getByText('Update your profile details')).toBeInTheDocument();
  });

  it('does not render description when omitted', () => {
    const { container } = render(<SectionHeader title="No desc" />);
    expect(container.querySelector('p')).toBeNull();
  });

  it('renders a divider element when divider=true', () => {
    const { container } = render(<SectionHeader title="With divider" divider />);
    // divider is a div with height:1 — check it exists via its inline style
    const divider = container.querySelector('div[style*="height: 1px"], div[style*="height:1"]');
    expect(divider).toBeTruthy();
  });

  it('renders as an h2', () => {
    render(<SectionHeader title="Heading check" />);
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
  });
});

// ─── SaveStatus ───────────────────────────────────────────────────────────────

describe('SaveStatus', () => {
  it('renders nothing when status is idle', () => {
    const { container } = render(<SaveStatus status="idle" />);
    // AnimatePresence mock renders children; visible=false means nothing is shown
    expect(container.firstChild).toBeNull();
  });

  it('shows "Saving..." when status is saving', async () => {
    render(<SaveStatus status="saving" />);
    expect(await screen.findByText('Saving...')).toBeInTheDocument();
  });

  it('shows "Saved" text when status is saved', async () => {
    render(<SaveStatus status="saved" />);
    expect(await screen.findByText(/^Saved/)).toBeInTheDocument();
  });

  it('shows custom error message when status is error', async () => {
    render(<SaveStatus status="error" message="Network error" />);
    expect(await screen.findByText('Network error')).toBeInTheDocument();
  });

  it('shows fallback error message when no message provided', async () => {
    render(<SaveStatus status="error" />);
    expect(await screen.findByText('Something went wrong')).toBeInTheDocument();
  });

  it('has role="alert" when status is error', async () => {
    render(<SaveStatus status="error" />);
    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });

  it('has role="status" when status is saving', async () => {
    render(<SaveStatus status="saving" />);
    expect(await screen.findByRole('status')).toBeInTheDocument();
  });
});

// ─── FormInput ────────────────────────────────────────────────────────────────

describe('FormInput', () => {
  it('renders a labeled text input', () => {
    render(<FormInput label="Full name" value="" onChange={jest.fn()} />);
    expect(screen.getByLabelText('Full name')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(
      <FormInput
        label="Bio"
        description="Tell us about yourself"
        value=""
        onChange={jest.fn()}
      />
    );
    expect(screen.getByText('Tell us about yourself')).toBeInTheDocument();
  });

  it('calls onChange with new value when user types', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<FormInput label="Name" value="" onChange={onChange} />);
    await user.type(screen.getByRole('textbox'), 'A');
    expect(onChange).toHaveBeenCalledWith('A');
  });

  it('calls onBlur when focus leaves', async () => {
    const user = userEvent.setup();
    const onBlur = jest.fn();
    render(
      <>
        <FormInput label="Name" value="" onChange={jest.fn()} onBlur={onBlur} />
        <button>other</button>
      </>
    );
    await user.click(screen.getByRole('textbox'));
    await user.click(screen.getByRole('button'));
    expect(onBlur).toHaveBeenCalled();
  });

  it('displays validation error message', () => {
    render(<FormInput label="Email" value="" onChange={jest.fn()} error="Invalid email" />);
    expect(screen.getByText('Invalid email')).toBeInTheDocument();
  });

  it('shows character counter when maxLength set', () => {
    render(<FormInput label="Bio" value="hello" onChange={jest.fn()} maxLength={100} />);
    expect(screen.getByText('5/100')).toBeInTheDocument();
  });

  it('turns counter red at limit', () => {
    render(<FormInput label="Bio" value={"x".repeat(100)} onChange={jest.fn()} maxLength={100} />);
    expect(screen.getByText('100/100')).toBeInTheDocument();
  });

  it('is disabled when disabled prop is true', () => {
    render(<FormInput label="Locked" value="" onChange={jest.fn()} disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('marks input as required with aria-required', () => {
    render(<FormInput label="Required field" value="" onChange={jest.fn()} required />);
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-required', 'true');
  });
});

// ─── FormCheckbox ─────────────────────────────────────────────────────────────

describe('FormCheckbox', () => {
  it('renders label text', () => {
    render(<FormCheckbox label="Send notifications" checked={false} onChange={jest.fn()} />);
    expect(screen.getByText('Send notifications')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(
      <FormCheckbox
        label="Alerts"
        description="Get email alerts for new signals"
        checked={false}
        onChange={jest.fn()}
      />
    );
    expect(screen.getByText('Get email alerts for new signals')).toBeInTheDocument();
  });

  it('reflects unchecked state', () => {
    render(<FormCheckbox label="Toggle" checked={false} onChange={jest.fn()} />);
    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });

  it('reflects checked state', () => {
    render(<FormCheckbox label="Toggle" checked={true} onChange={jest.fn()} />);
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('calls onChange(true) when unchecked box is clicked', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<FormCheckbox label="Toggle" checked={false} onChange={onChange} />);
    await user.click(screen.getByRole('checkbox'));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('calls onChange(false) when checked box is clicked', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<FormCheckbox label="Toggle" checked={true} onChange={onChange} />);
    await user.click(screen.getByRole('checkbox'));
    expect(onChange).toHaveBeenCalledWith(false);
  });
});

// ─── FormSelect ───────────────────────────────────────────────────────────────

describe('FormSelect', () => {
  const options = [
    { value: 'professional', label: 'Professional' },
    { value: 'casual', label: 'Casual' },
    { value: 'urgent', label: 'Urgent' },
  ];

  it('renders a labeled select', () => {
    render(<FormSelect label="Default Tone" options={options} value="professional" onChange={jest.fn()} />);
    expect(screen.getByLabelText('Default Tone')).toBeInTheDocument();
  });

  it('renders all options', () => {
    render(<FormSelect label="Tone" options={options} value="professional" onChange={jest.fn()} />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByText('Professional')).toBeInTheDocument();
    expect(screen.getByText('Casual')).toBeInTheDocument();
    expect(screen.getByText('Urgent')).toBeInTheDocument();
  });

  it('reflects the current value', () => {
    render(<FormSelect label="Tone" options={options} value="casual" onChange={jest.fn()} />);
    expect(screen.getByRole('combobox')).toHaveValue('casual');
  });

  it('calls onChange with selected value', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<FormSelect label="Tone" options={options} value="professional" onChange={onChange} />);
    await user.selectOptions(screen.getByRole('combobox'), 'urgent');
    expect(onChange).toHaveBeenCalledWith('urgent');
  });

  it('renders description when provided', () => {
    render(
      <FormSelect
        label="Tone"
        description="Choose your email style"
        options={options}
        value="professional"
        onChange={jest.fn()}
      />
    );
    expect(screen.getByText('Choose your email style')).toBeInTheDocument();
  });

  it('marks select as required with aria-required', () => {
    render(<FormSelect label="Tone" options={options} value="professional" onChange={jest.fn()} required />);
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-required', 'true');
  });
});
