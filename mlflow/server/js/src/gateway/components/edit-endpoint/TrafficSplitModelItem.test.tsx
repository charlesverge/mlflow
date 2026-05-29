import React, { useState } from 'react';

import { fastFillInput, renderWithDesignSystem, screen } from '@mlflow/mlflow/src/common/utils/TestUtils.react18';
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

jest.mock('../../hooks/useApiKeyConfiguration', () => ({
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
        showWeight={false}
        componentId="traffic-split-model"
      />
    );
  };

  return {
    onModelChange,
    ...renderWithDesignSystem(<TestHarness />),
  };
};

describe('TrafficSplitModelItem', () => {
  it('shows the Bedrock service tier selector for Bedrock models', () => {
    renderComponent();

    expect(screen.getByText('Service tier')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /auto/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /custom value/i })).toBeInTheDocument();
  });

  it('hides the service tier selector for non-Bedrock providers', () => {
    renderComponent({ provider: 'openai' });

    expect(screen.queryByText('Service tier')).not.toBeInTheDocument();
  });

  it('updates the model when selecting a predefined service tier', async () => {
    const user = userEvent.setup();
    const { onModelChange } = renderComponent();

    await user.click(screen.getByRole('radio', { name: /priority/i }));

    expect(onModelChange).toHaveBeenCalledWith(expect.objectContaining({ serviceTier: 'priority' }));
  });

  it('preserves custom service tiers and allows editing them', async () => {
    const user = userEvent.setup();
    const { onModelChange } = renderComponent({ serviceTier: 'reserved-tier' });

    const input = screen.getByPlaceholderText('Enter a custom service tier') as HTMLInputElement;
    expect(input.value).toBe('reserved-tier');

    await user.clear(input);
    await fastFillInput(input, 'enterprise-tier', user);

    expect(onModelChange).toHaveBeenCalledWith(expect.objectContaining({ serviceTier: 'enterprise-tier' }));
    expect(input.value).toBe('enterprise-tier');
  });

  it('clears the service tier when switching away from Bedrock', async () => {
    const user = userEvent.setup();
    const { onModelChange } = renderComponent({ serviceTier: 'priority' });

    await user.click(screen.getByRole('button', { name: 'Select OpenAI' }));

    expect(onModelChange).toHaveBeenCalledWith(expect.objectContaining({ provider: 'openai', serviceTier: '' }));
    expect(screen.queryByText('Service tier')).not.toBeInTheDocument();
  });
});
