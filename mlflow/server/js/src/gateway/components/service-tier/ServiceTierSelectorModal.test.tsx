import React from 'react';
import { describe, expect, it, jest } from '@jest/globals';
import { renderWithDesignSystem, screen } from '../../../common/utils/TestUtils.react18';
import userEvent from '@testing-library/user-event';
import { ServiceTierSelectorModal } from './ServiceTierSelectorModal';

const renderModal = (props: {
  isOpen?: boolean;
  onClose?: () => void;
  onSelect?: (value: string) => void;
  initialValue?: string;
}) => {
  const onClose = props.onClose ?? jest.fn();
  const onSelect = props.onSelect ?? jest.fn();

  return {
    onClose,
    onSelect,
    ...renderWithDesignSystem(
      <ServiceTierSelectorModal
        isOpen={props.isOpen ?? true}
        onClose={onClose}
        onSelect={onSelect}
        initialValue={props.initialValue}
      />,
    ),
  };
};

describe('ServiceTierSelectorModal', () => {
  it('does not render when isOpen is false', () => {
    renderModal({ isOpen: false });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders the modal title when open', () => {
    renderModal({});
    expect(screen.getByRole('dialog', { name: /select service tier/i })).toBeInTheDocument();
  });

  it('shows all predefined tier options', () => {
    renderModal({});
    expect(screen.getByText('auto')).toBeInTheDocument();
    expect(screen.getByText('default')).toBeInTheDocument();
    expect(screen.getByText('priority')).toBeInTheDocument();
    expect(screen.getByText('flex')).toBeInTheDocument();
  });

  it('shows the custom input section', () => {
    renderModal({});
    expect(screen.getByText(/use a custom service tier/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter service tier/i)).toBeInTheDocument();
  });

  it('confirm button is disabled with nothing selected', () => {
    renderModal({});
    expect(screen.getByRole('button', { name: /^select$/i })).toBeDisabled();
  });

  it('pre-populates a preset tier from initialValue', () => {
    renderModal({ initialValue: 'priority' });
    // Confirm is enabled because the preset tier was pre-selected
    expect(screen.getByRole('button', { name: /^select$/i })).not.toBeDisabled();
    // Clear selection button is visible
    expect(screen.getByRole('button', { name: /clear selection/i })).toBeInTheDocument();
  });

  it('pre-populates the custom input from an unrecognised initialValue', () => {
    renderModal({ initialValue: 'my-custom-tier' });
    const input = screen.getByPlaceholderText(/enter service tier/i) as HTMLInputElement;
    expect(input.value).toBe('my-custom-tier');
  });

  it('calls onSelect with the chosen preset tier and closes on confirm', async () => {
    const user = userEvent.setup();
    const { onSelect, onClose } = renderModal({});

    await user.click(screen.getByText('flex'));
    await user.click(screen.getByRole('button', { name: /^select$/i }));

    expect(onSelect).toHaveBeenCalledWith('flex');
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onSelect with the custom value on confirm', async () => {
    const user = userEvent.setup();
    const { onSelect } = renderModal({});

    await user.type(screen.getByPlaceholderText(/enter service tier/i), 'custom-enterprise');
    await user.click(screen.getByRole('button', { name: /^select$/i }));

    expect(onSelect).toHaveBeenCalledWith('custom-enterprise');
  });

  it('calls onClose without onSelect when Cancel is clicked', async () => {
    const user = userEvent.setup();
    const { onSelect, onClose } = renderModal({});

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(onSelect).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('shows the clear selection button only when something is selected', async () => {
    const user = userEvent.setup();
    renderModal({});

    expect(screen.queryByRole('button', { name: /clear selection/i })).not.toBeInTheDocument();

    await user.click(screen.getByText('auto'));

    expect(screen.getByRole('button', { name: /clear selection/i })).toBeInTheDocument();
  });

  it('calls onSelect with empty string and closes when clear selection is clicked', async () => {
    const user = userEvent.setup();
    const { onSelect, onClose } = renderModal({ initialValue: 'priority' });

    await user.click(screen.getByRole('button', { name: /clear selection/i }));

    expect(onSelect).toHaveBeenCalledWith('');
    expect(onClose).toHaveBeenCalled();
  });

  it('disables the custom input and enables preset list when a preset is selected', async () => {
    const user = userEvent.setup();
    renderModal({});

    await user.click(screen.getByText('auto'));

    // Custom input should be disabled when a preset is selected
    const customInput = screen.getByPlaceholderText(/enter service tier/i);
    expect(customInput).toBeDisabled();
  });
});
