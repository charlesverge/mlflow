import { useMutation, useQueryClient } from '@mlflow/mlflow/src/common/utils/reactQueryHooks';
import { GatewayApi } from '../api';

export const useUpdateModelDefinitionMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      modelDefinitionId: string;
      secretId?: string;
      provider?: string;
      modelName?: string;
      serviceTier?: string;
    }) =>
      GatewayApi.updateModelDefinition({
        model_definition_id: data.modelDefinitionId,
        secret_id: data.secretId,
        provider: data.provider,
        model_name: data.modelName,
        service_tier: data.serviceTier,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(['gateway_endpoints']);
      queryClient.invalidateQueries(['gateway_endpoint']);
      queryClient.invalidateQueries(['gateway_model_definitions']);
    },
  });
};
