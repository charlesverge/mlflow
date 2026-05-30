import React from 'react';
import { describe, expect, it, jest } from '@jest/globals';
import { renderWithDesignSystem, screen } from '../../../common/utils/TestUtils.react18';
import userEvent from '@testing-library/user-event';
import { ServiceTierSelect } from './ServiceTierSelect';

describe('ServiceTierSelect', () => {
  it('renders a disabled input when no provider is supplied', () => {
    renderWithDesignSystem(
      <ServiceTierSelect provider="" value="" onChange={jest.fn()} />,
    );

    expect(screen.getByRole('textbox', { name: /service tier/i })).toBeDisabled();
  });

  it('renders an enabled input when a provider is supplied', () => {
    renderWithDesignSystem(
      <ServiceTierSelect provider="openai" value="" onChange={jest.fn()} />,
    );

    expect(screen.getByRole('textbox', { name: /service tier/i })).not.toBeDisabled();
  });

  it('shows the current value in the input', () => {
    renderWithDesignSystem(
      <ServiceTierSelect provider="bedrock" value="priority" onChange={jest.fn()} />,
    );

    const input = screen.getByRole('textbox', { name: /service tier/i }) as HTMLInputElement;
    expect(input.value).toBe('priority');
  });

  it('does not open the modal when clicking a disabled trigger', async () => {
    const user = userEvent.setup();
    renderWithDesignSystem(
      <ServiceTierSelect provider="" value="" onChange={jest.fn()} />,
    );

    await user.click(screen.getByRole('textbox', { name: /service tier/i }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens the modal when the trigger is clicked with a provider', async () => {
    const user = userEvent.setup();
    renderWithDesignSystem(
      <ServiceTierSelect provider="bedrock" value="" onChange={jest.fn()} />,
    );

    await user.click(screen.getByRole('textbox', { name: /service tier/i }));

    expect(screen.getByRole('dialog', { name: /select service tier/i })).toBeInTheDocument();
  });

  it('calls onChange with the selected value after confirming in the modal', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    renderWithDesignSystem(
      <ServiceTierSelect provider="bedrock" value="" onChange={onChange} />,
    );

    await user.click(screen.getByRole('textbox', { name: /service tier/i }));
    await user.click(screen.getByText('flex'));
    await user.click(screen.getByRole('button', { name: /^select$/i }));

    expect(onChange).toHaveBeenCalledWith('flex');
  });

  it('closes the modal when Cancel is clicked without firing onChange', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    renderWithDesignSystem(
      <ServiceTierSelect provider="bedrock" value="" onChange={onChange} />,
    );

    await user.click(screen.getByRole('textbox', { name: /service tier/i }));
    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
