import React, { useState } from 'react';

import { describe, expect, it, jest } from '@jest/globals';
import { renderWithDesignSystem, screen } from '@mlflow/mlflow/src/common/utils/TestUtils.react18';
import userEvent from '@testing-library/user-event';

import type { TrafficSplitModel } from '../../hooks/useEditEndpointForm';
import { TrafficSplitModelItem } from './TrafficSplitModelItem';

jest.mock('../create-endpoint/ProviderSelect', () => ({
  ProviderSelect: ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
    <div>
      <div>Provider: {value}</div>
      <button onClick={() => onChange('bedrock')}>Select Bedrock</button>
      <button onClick={() => onChange('openai')}>Select OpenAI</button>
    </div>
  ),
}));

jest.mock('../create-endpoint/ModelSelect', () => ({
  ModelSelect: () => <div>Model select</div>,
}));

jest.mock('../model-configuration/hooks/useApiKeyConfiguration', () => ({
  useApiKeyConfiguration: () => ({
    isLoadingSecrets: false,
    existingSecrets: [],
    authModes: [],
    defaultAuthMode: undefined,
    isLoadingProviderConfig: false,
  }),
}));

jest.mock('../model-configuration/components/ApiKeyConfigurator', () => ({
  ApiKeyConfigurator: () => <div>API key configurator</div>,
}));

const makeModel = (overrides: Partial<TrafficSplitModel> = {}): TrafficSplitModel => ({
  modelDefinitionName: '',
  provider: 'bedrock',
  modelName: 'anthropic.claude-3',
  serviceTier: '',
  secretMode: 'existing',
  existingSecretId: 'secret-1',
  newSecret: {
    name: '',
    authMode: '',
    secretFields: {},
    configFields: {},
  },
  weight: 100,
  ...overrides,
});

const renderComponent = (initialModel: Partial<TrafficSplitModel> = {}) => {
  const onModelChange = jest.fn();

  const TestHarness = () => {
    const [model, setModel] = useState(makeModel(initialModel));

    return (
      <TrafficSplitModelItem
        index={0}
        model={model}
        onModelChange={(_, updates) => {
          onModelChange(updates);
          setModel((current) => ({ ...current, ...updates }));
        }}
        onWeightChange={jest.fn()}
        onRemove={jest.fn()}
        componentId="traffic-split-model"
      />
    );
  };

  return {
    onModelChange,
    ...renderWithDesignSystem(<TestHarness />),
  };
};

const expandModel = async (user: ReturnType<typeof userEvent.setup>) => {
  const expandButton = document.querySelector('[data-component-id="traffic-split-model.expand"]');

  if (!(expandButton instanceof HTMLButtonElement)) {
    throw new Error('Expand button not found');
  }

  await user.click(expandButton);
};

describe('TrafficSplitModelItem', () => {
  it('shows the service tier trigger for Bedrock models', async () => {
    const user = userEvent.setup();
    renderComponent();

    await expandModel(user);

    expect(screen.getByRole('textbox', { name: /service tier/i })).toBeInTheDocument();
  });

  it('shows the service tier trigger for non-Bedrock providers', async () => {
    const user = userEvent.setup();
    renderComponent({ provider: 'openai' });

    await expandModel(user);

    expect(screen.getByRole('textbox', { name: /service tier/i })).toBeInTheDocument();
  });

  it('disables the service tier trigger when no provider is set', () => {
    // When provider and modelName are both empty, the component starts already expanded.
    renderComponent({ provider: '', modelName: '' });
    expect(screen.getByRole('textbox', { name: /service tier/i })).toBeDisabled();
  });

  it('opens the service tier modal when the trigger is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    await expandModel(user);
    await user.click(screen.getByRole('textbox', { name: /service tier/i }));

    expect(screen.getByRole('dialog', { name: /select service tier/i })).toBeInTheDocument();
    expect(screen.getByText('auto')).toBeInTheDocument();
    expect(screen.getByText('priority')).toBeInTheDocument();
  });

  it('updates the model when selecting a predefined service tier', async () => {
    const user = userEvent.setup();
    const { onModelChange } = renderComponent();

    await expandModel(user);
    await user.click(screen.getByRole('textbox', { name: /service tier/i }));
    await user.click(screen.getByText('priority'));
    await user.click(screen.getByRole('button', { name: /^select$/i }));

    expect(onModelChange).toHaveBeenCalledWith(expect.objectContaining({ serviceTier: 'priority' }));
  });

  it('preserves custom service tiers and allows editing them in the modal', async () => {
    const user = userEvent.setup();
    const { onModelChange } = renderComponent({ serviceTier: 'reserved-tier' });

    await expandModel(user);
    await user.click(screen.getByRole('textbox', { name: /service tier/i }));

    const customInput = screen.getByPlaceholderText(/enter service tier/i) as HTMLInputElement;
    expect(customInput.value).toBe('reserved-tier');

    await user.clear(customInput);
    await user.type(customInput, 'reserved-tier-enterprise');
    await user.click(screen.getByRole('button', { name: /^select$/i }));

    expect(onModelChange).toHaveBeenCalledWith(expect.objectContaining({ serviceTier: 'reserved-tier-enterprise' }));
  });

  it('resets the service tier using the in-modal clear button', async () => {
    const user = userEvent.setup();
    const { onModelChange } = renderComponent({ serviceTier: 'priority' });

    await expandModel(user);
    await user.click(screen.getByRole('textbox', { name: /service tier/i }));
    await user.click(screen.getByRole('button', { name: /clear selection/i }));

    expect(onModelChange).toHaveBeenCalledWith(expect.objectContaining({ serviceTier: '' }));
  });

  it('clears the service tier when switching provider', async () => {
    const user = userEvent.setup();
    const { onModelChange } = renderComponent({ serviceTier: 'priority' });

    await expandModel(user);
    await user.click(screen.getByRole('button', { name: 'Select OpenAI' }));

    expect(onModelChange).toHaveBeenCalledWith(expect.objectContaining({ provider: 'openai', serviceTier: '' }));
  });
});

