import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { useEditEndpointForm } from './useEditEndpointForm';
import { useCreateModelDefinitionMutation } from './useCreateModelDefinitionMutation';
import { useCreateSecret } from './useCreateSecret';
import { useEndpointQuery } from './useEndpointQuery';
import { useEndpointsQuery } from './useEndpointsQuery';
import { useUpdateEndpointMutation } from './useUpdateEndpointMutation';
import { useUpdateModelDefinitionMutation } from './useUpdateModelDefinitionMutation';
import type { Endpoint } from '../types';

const mockNavigate = jest.fn<(path: string) => void>();
const mockInvalidateQueries = jest.fn<(queryKey: unknown) => Promise<void>>();
const mockCreateModelDefinition = jest.fn<
  (request: unknown) => Promise<{ model_definition: { model_definition_id: string } }>
>();
const mockCreateSecret = jest.fn<(request: unknown) => Promise<{ secret: { secret_id: string } }>>();
const mockUpdateEndpoint = jest.fn<(request: unknown) => Promise<unknown>>();
const mockUpdateModelDefinition = jest.fn<(request: unknown) => Promise<unknown>>();

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

const makeEndpoint = (): { endpoint: Endpoint } => ({
  endpoint: {
    endpoint_id: 'ep-1',
    name: 'test-endpoint',
    created_at: 0,
    last_updated_at: 0,
    usage_tracking: false,
    experiment_id: 'exp-1',
    model_mappings: [
      {
        mapping_id: 'mapping-primary',
        endpoint_id: 'ep-1',
        model_definition_id: 'md-1',
        linkage_type: 'PRIMARY',
        weight: 1,
        created_at: 0,
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
      {
        mapping_id: 'mapping-fallback',
        endpoint_id: 'ep-1',
        model_definition_id: 'md-fallback',
        linkage_type: 'FALLBACK',
        fallback_order: 1,
        weight: 0,
        created_at: 0,
        model_definition: {
          model_definition_id: 'md-fallback',
          name: 'fallback-model',
          secret_id: 'secret-fallback',
          secret_name: 'secret-fallback',
          provider: 'openai',
          model_name: 'gpt-4o-mini',
          created_at: 0,
          last_updated_at: 0,
          endpoint_count: 1,
        },
      },
    ],
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
      expect(result.current.form.getValues()).toEqual({
        name: 'test-endpoint',
        trafficSplitModels: [
          {
            modelDefinitionId: 'md-1',
            modelDefinitionName: 'primary-model',
            provider: 'bedrock',
            modelName: 'anthropic.claude-3',
            serviceTier: 'priority',
            secretMode: 'existing',
            existingSecretId: 'secret-1',
            newSecret: {
              name: '',
              authMode: '',
              secretFields: {},
              configFields: {},
            },
            weight: 100,
          },
        ],
        fallbackModels: [
          {
            modelDefinitionId: 'md-fallback',
            modelDefinitionName: 'fallback-model',
            provider: 'openai',
            modelName: 'gpt-4o-mini',
            secretMode: 'existing',
            existingSecretId: 'secret-fallback',
            newSecret: {
              name: '',
              authMode: '',
              secretFields: {},
              configFields: {},
            },
            fallbackOrder: 1,
          },
        ],
        usageTracking: false,
        experimentId: 'exp-1',
      });
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

  it('creates a new model definition when a saved service tier is cleared', async () => {
    const { result } = renderHook(() => useEditEndpointForm('ep-1'));

    await waitFor(() => {
      expect(result.current.form.getValues('trafficSplitModels')).toHaveLength(1);
    });

    act(() => {
      const [model] = result.current.form.getValues('trafficSplitModels');
      result.current.form.setValue('trafficSplitModels', [{ ...model, serviceTier: '' }], { shouldDirty: true });
    });

    await act(async () => {
      await result.current.handleSubmit(result.current.form.getValues());
    });

    expect(mockUpdateModelDefinition).not.toHaveBeenCalled();
    expect(mockCreateModelDefinition).toHaveBeenCalledWith(
      expect.objectContaining({
        secret_id: 'secret-1',
        provider: 'bedrock',
        model_name: 'anthropic.claude-3',
        service_tier: undefined,
      }),
    );
    expect(mockUpdateEndpoint).toHaveBeenCalledWith(
      expect.objectContaining({
        model_configs: expect.arrayContaining([
          expect.objectContaining({
            model_definition_id: 'md-new',
            linkage_type: 'PRIMARY',
          }),
          expect.objectContaining({
            model_definition_id: 'md-fallback',
            linkage_type: 'FALLBACK',
            fallback_order: 1,
          }),
        ]),
      }),
    );
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
