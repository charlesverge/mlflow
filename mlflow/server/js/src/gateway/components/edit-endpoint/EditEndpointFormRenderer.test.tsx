import React from 'react';
import { describe, expect, jest, test } from '@jest/globals';
import { useForm } from 'react-hook-form';
import { MemoryRouter } from '../../../common/utils/RoutingUtils';
import { renderWithDesignSystem, screen } from '../../../common/utils/TestUtils.react18';
import { EditEndpointFormRenderer } from './EditEndpointFormRenderer';
import type { EditEndpointFormData, FallbackModel, TrafficSplitModel } from '../../hooks/useEditEndpointForm';
import type { Endpoint } from '../../types';

jest.mock('./TrafficSplitConfigurator', () => ({
  TrafficSplitConfigurator: ({ value }: { value: TrafficSplitModel[] }) => (
    <div>{value.some((model) => model.provider === 'bedrock') ? 'Primary service tier visible' : 'Primary service tier hidden'}</div>
  ),
}));
jest.mock('./FallbackModelsConfigurator', () => ({
  FallbackModelsConfigurator: ({ value }: { value: FallbackModel[] }) => (
    <div>{value.some((model) => model.provider === 'bedrock') ? 'Fallback service tier hidden' : 'Fallback models rendered'}</div>
  ),
}));
jest.mock('./StarterCodeCard', () => ({ StarterCodeCard: () => null }));
jest.mock('./EditableEndpointName', () => ({ EditableEndpointName: () => null }));
jest.mock('./GatewayUsageSection', () => ({ GatewayUsageSection: () => null }));
jest.mock('../guardrails/GuardrailsTabContent', () => ({ GuardrailsTabContent: () => null }));
jest.mock('../../../common/components/long-form/LongFormSummary', () => ({
  LongFormSummary: ({ children }: any) => children,
}));
jest.mock('../../../experiment-tracking/components/experiment-page/components/traces-v3/TracesV3Logs', () => ({
  TracesV3Logs: () => null,
}));
jest.mock('../../../experiment-tracking/hooks/useMonitoringConfig', () => ({
  MonitoringConfigProvider: ({ children }: any) => children,
}));
jest.mock('../../../experiment-tracking/hooks/useMonitoringFilters', () => ({
  useMonitoringFiltersTimeRange: () => ({ key: 'LAST_1_HOUR' }),
}));
jest.mock('../../../experiment-tracking/components/experiment-page/components/traces-v3/TracesV3DateSelector', () => ({
  TracesV3DateSelector: () => null,
}));

const endpoint: Endpoint = {
  endpoint_id: 'ep-1',
  name: 'test-endpoint',
  created_at: 1735689600000,
  last_updated_at: 1735689600000,
  model_mappings: [],
};

const makeTrafficSplitModel = (overrides: Partial<TrafficSplitModel> = {}): TrafficSplitModel => ({
  modelDefinitionName: '',
  provider: '',
  modelName: '',
  serviceTier: '',
  secretMode: 'existing',
  existingSecretId: 'secret-1',
  newSecret: { name: '', authMode: '', secretFields: {}, configFields: {} },
  weight: 100,
  ...overrides,
});

const makeFallbackModel = (overrides: Partial<FallbackModel> = {}): FallbackModel => ({
  modelDefinitionName: '',
  provider: '',
  modelName: '',
  secretMode: 'existing',
  existingSecretId: 'secret-2',
  newSecret: { name: '', authMode: '', secretFields: {}, configFields: {} },
  fallbackOrder: 1,
  ...overrides,
});

const TestHarness = ({
  experimentId,
  initialEntry,
  trafficSplitModels = [],
  fallbackModels = [],
}: {
  experimentId: string;
  initialEntry: string;
  trafficSplitModels?: TrafficSplitModel[];
  fallbackModels?: FallbackModel[];
}) => {
  const form = useForm<EditEndpointFormData>({
    defaultValues: {
      name: endpoint.name,
      trafficSplitModels,
      fallbackModels,
      usageTracking: Boolean(experimentId),
      experimentId,
    },
  });

  return (
    <MemoryRouter initialEntries={[initialEntry]}>
      <EditEndpointFormRenderer
        form={form}
        isLoadingEndpoint={false}
        isSubmitting={false}
        loadError={null}
        mutationError={null}
        errorMessage={null}
        endpoint={endpoint}
        existingEndpoints={[endpoint]}
        isFormComplete
        hasChanges={false}
        onSubmit={jest.fn(async () => {})}
        onCancel={jest.fn()}
        onNameUpdate={jest.fn(async () => {})}
        onUsageTrackingUpdate={jest.fn(async () => {})}
      />
    </MemoryRouter>
  );
};

describe('EditEndpointFormRenderer', () => {
  test('disables Guardrails tab when experiment id is missing', () => {
    renderWithDesignSystem(<TestHarness experimentId="" initialEntry="/?tab=overview" />);
    expect(screen.getByRole('tab', { name: 'Guardrails' })).toBeDisabled();
  });

  test('keeps Guardrails tab enabled when requested directly in URL', () => {
    renderWithDesignSystem(<TestHarness experimentId="" initialEntry="/?tab=guardrails" />);
    expect(screen.getByRole('tab', { name: 'Guardrails' })).not.toBeDisabled();
  });

  test('shows the service tier field only for Bedrock primary models', () => {
    renderWithDesignSystem(
      <TestHarness
        experimentId="exp-1"
        initialEntry="/?tab=overview"
        trafficSplitModels={[makeTrafficSplitModel({ provider: 'bedrock', modelName: 'anthropic.claude-3' })]}
        fallbackModels={[makeFallbackModel({ provider: 'bedrock', modelName: 'anthropic.claude-3' })]}
      />,
    );

    expect(screen.getByText('Primary service tier visible')).toBeInTheDocument();
    expect(screen.getByText('Fallback service tier hidden')).toBeInTheDocument();
  });

  test('keeps the primary service tier hidden for non-Bedrock models', () => {
    renderWithDesignSystem(
      <TestHarness
        experimentId="exp-1"
        initialEntry="/?tab=overview"
        trafficSplitModels={[makeTrafficSplitModel({ provider: 'openai', modelName: 'gpt-4o-mini' })]}
      />,
    );

    expect(screen.getByText('Primary service tier hidden')).toBeInTheDocument();
  });
});
