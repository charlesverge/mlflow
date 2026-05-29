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
  it('shows the Bedrock service tier selector for Bedrock models', async () => {
    const user = userEvent.setup();
    renderComponent();

    await expandModel(user);

    expect(screen.getByText('Service tier')).toBeInTheDocument();

    await user.click(screen.getByRole('combobox', { name: /service tier/i }));

    expect(screen.getByRole('option', { name: /auto/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /custom value/i })).toBeInTheDocument();
  });

  it('hides the service tier selector for non-Bedrock providers', async () => {
    const user = userEvent.setup();
    renderComponent({ provider: 'openai' });

    await expandModel(user);

    expect(screen.queryByText('Service tier')).not.toBeInTheDocument();
  });

  it('updates the model when selecting a predefined service tier', async () => {
    const user = userEvent.setup();
    const { onModelChange } = renderComponent();

    await expandModel(user);
    await user.click(screen.getByRole('combobox', { name: /service tier/i }));
    await user.click(screen.getByRole('option', { name: /priority/i }));

    expect(onModelChange).toHaveBeenCalledWith(expect.objectContaining({ serviceTier: 'priority' }));
  });

  it('preserves custom service tiers and allows editing them', async () => {
    const user = userEvent.setup();
    const { onModelChange } = renderComponent({ serviceTier: 'reserved-tier' });

    await expandModel(user);

    const input = screen.getByPlaceholderText('Enter a custom service tier') as HTMLInputElement;
    expect(input.value).toBe('reserved-tier');

    await user.type(input, '-enterprise');

    expect(onModelChange).toHaveBeenCalledWith(expect.objectContaining({ serviceTier: 'reserved-tier-enterprise' }));
    expect(input.value).toBe('reserved-tier-enterprise');
  });

  it('resets the service tier when clearing the current selection', async () => {
    const user = userEvent.setup();
    const { onModelChange } = renderComponent({ serviceTier: 'priority' });

    await expandModel(user);
    await user.click(screen.getByRole('button', { name: /clear selection/i }));

    expect(onModelChange).toHaveBeenCalledWith(expect.objectContaining({ serviceTier: '' }));
  });

  it('clears the service tier when switching away from Bedrock', async () => {
    const user = userEvent.setup();
    const { onModelChange } = renderComponent({ serviceTier: 'priority' });

    await expandModel(user);
    await user.click(screen.getByRole('button', { name: 'Select OpenAI' }));

    expect(onModelChange).toHaveBeenCalledWith(expect.objectContaining({ provider: 'openai', serviceTier: '' }));
    expect(screen.queryByText('Service tier')).not.toBeInTheDocument();
  });
});
