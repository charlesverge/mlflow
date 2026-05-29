import { act, renderHook, waitFor } from '@testing-library/react';

import { useEditEndpointForm } from './useEditEndpointForm';
import { useCreateModelDefinitionMutation } from './useCreateModelDefinitionMutation';
import { useCreateSecret } from './useCreateSecret';
import { useEndpointQuery } from './useEndpointQuery';
import { useEndpointsQuery } from './useEndpointsQuery';
import { useUpdateEndpointMutation } from './useUpdateEndpointMutation';
import { useUpdateModelDefinitionMutation } from './useUpdateModelDefinitionMutation';

const mockNavigate = jest.fn();
const mockInvalidateQueries = jest.fn();
const mockCreateModelDefinition = jest.fn();
const mockCreateSecret = jest.fn();
const mockUpdateEndpoint = jest.fn();
const mockUpdateModelDefinition = jest.fn();

jest.mock('@mlflow/mlflow/src/common/utils/RoutingUtils', () => ({
  useNavigate: () => mockNavigate,
}));

jest.mock('@mlflow/mlflow/src/common/utils/reactQueryHooks', () => ({
  useQueryClient: () => ({
    invalidateQueries: mockInvalidateQueries,
  }),
}));

jest.mock('./useEndpointQuery');
jest.mock('./useEndpointsQuery');
jest.mock('./useUpdateEndpointMutation');
jest.mock('./useCreateModelDefinitionMutation');
jest.mock('./useUpdateModelDefinitionMutation');
jest.mock('./useCreateSecret');

const mockedUseEndpointQuery = jest.mocked(useEndpointQuery);
const mockedUseEndpointsQuery = jest.mocked(useEndpointsQuery);
const mockedUseUpdateEndpointMutation = jest.mocked(useUpdateEndpointMutation);
const mockedUseCreateModelDefinitionMutation = jest.mocked(useCreateModelDefinitionMutation);
const mockedUseUpdateModelDefinitionMutation = jest.mocked(useUpdateModelDefinitionMutation);
const mockedUseCreateSecret = jest.mocked(useCreateSecret);

const makeEndpoint = () => ({
  endpoint: {
    endpoint_id: 'ep-1',
    name: 'test-endpoint',
    endpoint_type: 'llm/v1/chat',
    config: {
      route_type: 'llm/v1/chat',
      model: {
        name: 'test-endpoint',
        provider: 'bedrock',
      },
      model_configs: [
        {
          served_entities: [
            {
              external_model: {
                name: 'primary-model',
                provider: 'bedrock',
                task: 'llm/v1/chat',
                config: {
                  model: 'anthropic.claude-3',
                },
              },
              entity_name: 'primary-model',
              entity_type: 'external_model',
              traffic_percentage: 100,
              model_definition: {
                model_definition_id: 'md-1',
                name: 'primary-model',
                secret_id: 'secret-1',
                secret_name: 'secret-1',
                provider: 'bedrock',
                model_name: 'anthropic.claude-3',
                service_tier: 'priority',
                created_at: 0,
                last_updated_at: 0,
                endpoint_count: 1,
              },
            },
          ],
        },
      ],
      guardrails: {},
      usage_tracking_config: {
        enabled: false,
      },
    },
  },
});

describe('useEditEndpointForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockCreateModelDefinition.mockResolvedValue({
      model_definition: { model_definition_id: 'md-new' },
    });
    mockCreateSecret.mockResolvedValue({ secret: { secret_id: 'secret-new' } });
    mockUpdateEndpoint.mockResolvedValue({});
    mockUpdateModelDefinition.mockResolvedValue({});

    mockedUseEndpointQuery.mockReturnValue({
      data: makeEndpoint(),
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);
    mockedUseEndpointsQuery.mockReturnValue({
      data: { endpoints: [] },
      isLoading: false,
      error: null,
    } as any);
    mockedUseUpdateEndpointMutation.mockReturnValue({
      mutateAsync: mockUpdateEndpoint,
      error: null,
      isLoading: false,
    } as any);
    mockedUseCreateModelDefinitionMutation.mockReturnValue({
      mutateAsync: mockCreateModelDefinition,
      error: null,
      isLoading: false,
    } as any);
    mockedUseUpdateModelDefinitionMutation.mockReturnValue({
      mutateAsync: mockUpdateModelDefinition,
      error: null,
      isLoading: false,
    } as any);
    mockedUseCreateSecret.mockReturnValue({
      mutateAsync: mockCreateSecret,
      error: null,
      isLoading: false,
    } as any);
  });

  it('hydrates traffic split models with service tiers from the endpoint', async () => {
    const { result } = renderHook(() => useEditEndpointForm('ep-1'));

    await waitFor(() => {
      expect(result.current.form.getValues('trafficSplitModels')[0].serviceTier).toBe('priority');
    });
  });

  it('marks the form dirty when only the service tier changes', async () => {
    const { result } = renderHook(() => useEditEndpointForm('ep-1'));

    await waitFor(() => {
      expect(result.current.hasChanges).toBe(false);
    });

    act(() => {
      const [model] = result.current.form.getValues('trafficSplitModels');
      result.current.form.setValue('trafficSplitModels', [{ ...model, serviceTier: 'flex' }], { shouldDirty: true });
    });

    await waitFor(() => {
      expect(result.current.hasChanges).toBe(true);
    });
  });

  it('includes service_tier when updating an existing model definition', async () => {
    const { result } = renderHook(() => useEditEndpointForm('ep-1'));

    await waitFor(() => {
      expect(result.current.form.getValues('trafficSplitModels')).toHaveLength(1);
    });

    act(() => {
      const [model] = result.current.form.getValues('trafficSplitModels');
      result.current.form.setValue('trafficSplitModels', [{ ...model, serviceTier: 'flex' }], { shouldDirty: true });
    });

    await act(async () => {
      await result.current.handleSubmit(result.current.form.getValues());
    });

    expect(mockUpdateModelDefinition).toHaveBeenCalledWith({
      modelDefinitionId: 'md-1',
      secretId: 'secret-1',
      provider: 'bedrock',
      modelName: 'anthropic.claude-3',
      serviceTier: 'flex',
    });
  });

  it('includes service_tier when creating a new model definition during edit', async () => {
    const { result } = renderHook(() => useEditEndpointForm('ep-1'));

    await waitFor(() => {
      expect(result.current.form.getValues('trafficSplitModels')).toHaveLength(1);
    });

    act(() => {
      result.current.form.setValue(
        'trafficSplitModels',
        [
          {
            modelDefinitionName: 'secondary-model',
            provider: 'bedrock',
            modelName: 'anthropic.claude-3-5',
            serviceTier: 'auto',
            secretMode: 'existing',
            existingSecretId: 'secret-2',
            newSecret: {
              name: '',
              authMode: '',
              secretFields: {},
              configFields: {},
            },
            weight: 100,
          },
        ],
        { shouldDirty: true },
      );
    });

    await act(async () => {
      await result.current.handleSubmit(result.current.form.getValues());
    });

    expect(mockCreateModelDefinition).toHaveBeenCalledWith(
      expect.objectContaining({
        secret_id: 'secret-2',
        provider: 'bedrock',
        model_name: 'anthropic.claude-3-5',
        service_tier: 'auto',
      }),
    );
  });
});
