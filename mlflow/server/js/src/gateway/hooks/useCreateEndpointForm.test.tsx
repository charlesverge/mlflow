import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { useCreateEndpointForm } from './useCreateEndpointForm';
import { useCreateEndpointMutation } from './useCreateEndpointMutation';
import { useCreateSecret } from './useCreateSecret';
import { useCreateModelDefinitionMutation } from './useCreateModelDefinitionMutation';
import { useSetEndpointTagMutation } from './useSetEndpointTagMutation';
import { useModelsQuery } from './useModelsQuery';
import { useEndpointsQuery } from './useEndpointsQuery';
import { useProviderConfigQuery } from './useProviderConfigQuery';
import { useSecretsQuery } from './useSecretsQuery';

const mockCreateEndpoint = jest.fn<(request: unknown) => Promise<{ endpoint: { endpoint_id: string; name: string; created_at: number; last_updated_at: number; model_mappings: never[] } }>>();
const mockCreateSecret = jest.fn<(request: unknown) => Promise<{ secret: { secret_id: string } }>>();
const mockCreateModelDefinition = jest.fn<(request: unknown) => Promise<{ model_definition: { model_definition_id: string } }>>();
const mockSetEndpointTag = jest.fn<(request: unknown) => Promise<unknown>>();

jest.mock('./useCreateEndpointMutation');
jest.mock('./useCreateSecret');
jest.mock('./useCreateModelDefinitionMutation');
jest.mock('./useSetEndpointTagMutation');
jest.mock('./useModelsQuery');
jest.mock('./useEndpointsQuery');
jest.mock('./useProviderConfigQuery');
jest.mock('./useSecretsQuery');

const mockedUseCreateEndpointMutation = jest.mocked(useCreateEndpointMutation);
const mockedUseCreateSecret = jest.mocked(useCreateSecret);
const mockedUseCreateModelDefinitionMutation = jest.mocked(useCreateModelDefinitionMutation);
const mockedUseSetEndpointTagMutation = jest.mocked(useSetEndpointTagMutation);
const mockedUseModelsQuery = jest.mocked(useModelsQuery);
const mockedUseEndpointsQuery = jest.mocked(useEndpointsQuery);
const mockedUseProviderConfigQuery = jest.mocked(useProviderConfigQuery);
const mockedUseSecretsQuery = jest.mocked(useSecretsQuery);

describe('useCreateEndpointForm — service tier', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockCreateEndpoint.mockResolvedValue({
      endpoint: { endpoint_id: 'ep-1', name: 'test-endpoint', created_at: 0, last_updated_at: 0, model_mappings: [] },
    });
    mockCreateSecret.mockResolvedValue({ secret: { secret_id: 'secret-1' } });
    mockCreateModelDefinition.mockResolvedValue({
      model_definition: { model_definition_id: 'md-1' },
    });
    mockSetEndpointTag.mockResolvedValue({});

    mockedUseCreateEndpointMutation.mockReturnValue({
      mutateAsync: mockCreateEndpoint,
      error: null,
      isLoading: false,
      reset: jest.fn(),
    } as any);
    mockedUseCreateSecret.mockReturnValue({
      mutateAsync: mockCreateSecret,
      error: null,
      isLoading: false,
      reset: jest.fn(),
    } as any);
    mockedUseCreateModelDefinitionMutation.mockReturnValue({
      mutateAsync: mockCreateModelDefinition,
      error: null,
      isLoading: false,
      reset: jest.fn(),
    } as any);
    mockedUseSetEndpointTagMutation.mockReturnValue({
      mutateAsync: mockSetEndpointTag,
    } as any);
    mockedUseModelsQuery.mockReturnValue({ data: [] } as any);
    mockedUseEndpointsQuery.mockReturnValue({ data: [] } as any);
    mockedUseProviderConfigQuery.mockReturnValue({ data: undefined } as any);
    mockedUseSecretsQuery.mockReturnValue({ data: [] } as any);
  });

  it('initialises serviceTier to an empty string', () => {
    const { result } = renderHook(() => useCreateEndpointForm());
    expect(result.current.form.getValues('serviceTier')).toBe('');
  });

  it('resets serviceTier to empty string when provider changes', async () => {
    const { result } = renderHook(() => useCreateEndpointForm());

    act(() => {
      result.current.form.setValue('provider', 'bedrock');
      result.current.form.setValue('serviceTier', 'priority');
    });

    expect(result.current.form.getValues('serviceTier')).toBe('priority');

    act(() => {
      result.current.form.setValue('provider', 'openai');
    });

    await waitFor(() => {
      expect(result.current.form.getValues('serviceTier')).toBe('');
    });
  });

  it('sends service_tier in the createModelDefinition call when set', async () => {
    const { result } = renderHook(() => useCreateEndpointForm());

    act(() => {
      result.current.form.setValue('name', 'my-endpoint');
      result.current.form.setValue('provider', 'bedrock');
      result.current.form.setValue('modelName', 'anthropic.claude-3');
      result.current.form.setValue('serviceTier', 'priority');
      result.current.form.setValue('secretMode', 'new');
      result.current.form.setValue('newSecret', {
        name: 'my-secret',
        authMode: 'api_key',
        secretFields: { api_key: 'test-key' },
        configFields: {},
      });
    });

    await act(async () => {
      await result.current.handleSubmit(result.current.form.getValues());
    });

    expect(mockCreateModelDefinition).toHaveBeenCalledWith(
      expect.objectContaining({ service_tier: 'priority' }),
    );
  });

  it('omits service_tier from the API call when serviceTier is an empty string', async () => {
    const { result } = renderHook(() => useCreateEndpointForm());

    act(() => {
      result.current.form.setValue('name', 'my-endpoint');
      result.current.form.setValue('provider', 'openai');
      result.current.form.setValue('modelName', 'gpt-4o-mini');
      result.current.form.setValue('serviceTier', '');
      result.current.form.setValue('secretMode', 'new');
      result.current.form.setValue('newSecret', {
        name: 'my-secret',
        authMode: 'api_key',
        secretFields: { api_key: 'test-key' },
        configFields: {},
      });
    });

    await act(async () => {
      await result.current.handleSubmit(result.current.form.getValues());
    });

    expect(mockCreateModelDefinition).toHaveBeenCalledWith(
      expect.objectContaining({ service_tier: undefined }),
    );
  });
});
