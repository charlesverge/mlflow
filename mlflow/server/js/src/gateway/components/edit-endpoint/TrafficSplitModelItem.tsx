import {
  Button,
  ChevronDownIcon,
  ChevronRightIcon,
  FormUI,
  SimpleSelect,
  SimpleSelectOption,
  Tooltip,
  Typography,
  useDesignSystemTheme,
  TrashIcon,
} from '@databricks/design-system';
import { FormattedMessage, useIntl } from 'react-intl';
import { useMemo, useRef, useState } from 'react';
import { GatewayInput } from '../common';
import type { TrafficSplitModel } from '../../hooks/useEditEndpointForm';
import { ProviderSelect } from '../create-endpoint/ProviderSelect';
import { ModelSelect } from '../create-endpoint/ModelSelect';
import { ApiKeyConfigurator } from '../model-configuration/components/ApiKeyConfigurator';
import { useApiKeyConfiguration } from '../model-configuration/hooks/useApiKeyConfiguration';
import type { ApiKeyConfiguration } from '../model-configuration/types';
import { formatProviderName } from '../../utils/providerUtils';

interface TrafficSplitModelItemProps {
  model: TrafficSplitModel;
  index: number;
  onModelChange: (index: number, updates: Partial<TrafficSplitModel>) => void;
  onWeightChange: (index: number, weight: number) => void;
  onRemove: (index: number) => void;
  componentId: string;
}

const BEDROCK_SERVICE_TIER_OPTIONS = [
  {
    value: 'auto',
    description:
      'The default behavior. The system automatically uses specialized tier credits (like Scale Tier) if available.',
  },
  {
    value: 'default',
    description:
      'Forces the request to be processed in the standard, shared public cluster using standard pay-as-you-go pricing.',
  },
  {
    value: 'priority',
    description: 'Routes traffic to Priority Processing for lower latency, billed at a premium rate per token.',
  },
  {
    value: 'flex',
    description:
      'Routes traffic to Flex Processing for a significant cost reduction in exchange for higher latency and lower availability.',
  },
] as const;

type BedrockServiceTierOption = (typeof BEDROCK_SERVICE_TIER_OPTIONS)[number]['value'];
type BedrockServiceTierSelection = BedrockServiceTierOption | 'custom';

export const TrafficSplitModelItem = ({
  model,
  index,
  onModelChange,
  onWeightChange,
  onRemove,
  componentId,
}: TrafficSplitModelItemProps) => {
  const { theme } = useDesignSystemTheme();
  const intl = useIntl();
  const domId = useRef(`traffic-split-${Math.random().toString(36).slice(2, 9)}`).current;
  const [isExpanded, setIsExpanded] = useState(!model.provider && !model.modelName);
  const [localWeightInput, setLocalWeightInput] = useState<string | null>(null);

  const weightInputValue = localWeightInput ?? (model.weight === 0 ? '' : String(model.weight));

  const { existingSecrets, isLoadingSecrets, authModes, defaultAuthMode, isLoadingProviderConfig } =
    useApiKeyConfiguration({
      provider: model.provider,
    });

  const apiKeyConfig: ApiKeyConfiguration = {
    mode: model.secretMode,
    existingSecretId: model.existingSecretId,
    newSecret: model.newSecret,
  };

  const serviceTierSelection = useMemo<BedrockServiceTierSelection | undefined>(() => {
    if (!model.serviceTier) {
      return undefined;
    }

    const matchedServiceTierOption = BEDROCK_SERVICE_TIER_OPTIONS.find(({ value }) => value === model.serviceTier);

    return matchedServiceTierOption?.value ?? 'custom';
  }, [model.serviceTier]);

  const handleApiKeyChange = (config: ApiKeyConfiguration) => {
    onModelChange(index, {
      secretMode: config.mode,
      existingSecretId: config.existingSecretId,
      newSecret: config.newSecret,
    });
  };

  const selectedServiceTierOption = useMemo(
    () => BEDROCK_SERVICE_TIER_OPTIONS.find(({ value }) => value === serviceTierSelection),
    [serviceTierSelection],
  );

  const customServiceTierDescription = intl.formatMessage({
    defaultMessage: 'Enter any Bedrock-supported service tier value.',
    description: 'Description for custom Bedrock service tier option',
  });

  const handleServiceTierChange = (value: string) => {
    if (!value) {
      onModelChange(index, { serviceTier: '' });
      return;
    }

    const selection = value as BedrockServiceTierSelection;
    onModelChange(index, {
      serviceTier: selection === 'custom' ? (serviceTierSelection === 'custom' ? model.serviceTier : '') : selection,
    });
  };

  const hasModelInfo = model.provider && model.modelName;

  return (
    <div
      css={{
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing.md,
        padding: theme.spacing.md,
        border: `2px solid ${theme.colors.border}`,
        borderRadius: theme.borders.borderRadiusMd,
        backgroundColor: theme.colors.backgroundPrimary,
      }}
    >
      <div css={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div css={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, flex: 1 }}>
          <Button
            componentId={`${componentId}.expand`}
            icon={isExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
            onClick={() => setIsExpanded(!isExpanded)}
            size="small"
          />
          <FormUI.Label css={{ margin: 0, fontWeight: 'bold' }}>
            <FormattedMessage
              defaultMessage="Model {number}"
              description="Label for traffic split model"
              values={{ number: index + 1 }}
            />
          </FormUI.Label>
          {!isExpanded && hasModelInfo && (
            <Typography.Text css={{ fontFamily: 'monospace', color: theme.colors.textSecondary }}>
              {formatProviderName(model.provider)} / {model.modelName}
              <span css={{ marginLeft: theme.spacing.sm, color: theme.colors.actionTertiaryTextDefault }}>
                ({model.weight}%)
              </span>
            </Typography.Text>
          )}
        </div>
        <Tooltip
          componentId={`${componentId}.remove-tooltip`}
          content={intl.formatMessage({
            defaultMessage: 'Remove model',
            description: 'Tooltip for remove traffic split model button',
          })}
        >
          <Button componentId={`${componentId}.remove`} icon={<TrashIcon />} onClick={() => onRemove(index)} />
        </Tooltip>
      </div>

      {isExpanded && (
        <>
          <ProviderSelect
            value={model.provider}
            onChange={(provider) => {
              onModelChange(index, {
                provider,
                modelName: '',
                serviceTier: '',
                secretMode: 'new',
                existingSecretId: '',
                newSecret: {
                  name: '',
                  authMode: '',
                  secretFields: {},
                  configFields: {},
                },
              });
            }}
            componentId={`${componentId}.provider`}
          />

          <ModelSelect
            provider={model.provider}
            value={model.modelName}
            onChange={(modelName) => onModelChange(index, { modelName })}
            componentId={`${componentId}.model`}
          />

          {model.provider === 'bedrock' && (
            <div>
              <div
                css={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: theme.spacing.sm,
                  marginBottom: theme.spacing.sm,
                }}
              >
                <FormUI.Label htmlFor={`${domId}.service-tier`} css={{ margin: 0 }}>
                  <FormattedMessage defaultMessage="Service tier" description="Label for Bedrock service tier selector" />
                </FormUI.Label>
                {model.serviceTier && (
                  <Button
                    componentId={`${componentId}.service-tier.clear`}
                    type="tertiary"
                    size="small"
                    onClick={() => onModelChange(index, { serviceTier: '' })}
                  >
                    <FormattedMessage
                      defaultMessage="Clear selection"
                      description="Button to clear the selected Bedrock service tier"
                    />
                  </Button>
                )}
              </div>

              <SimpleSelect
                id={`${domId}.service-tier`}
                componentId={`${componentId}.service-tier`}
                value={serviceTierSelection ?? ''}
                onChange={({ target }) => handleServiceTierChange(target.value)}
                placeholder={intl.formatMessage({
                  defaultMessage: 'Select an optional service tier',
                  description: 'Placeholder for Bedrock service tier selector',
                })}
                contentProps={{
                  matchTriggerWidth: true,
                  maxHeight: 320,
                }}
                css={{ width: '100%' }}
              >
                {BEDROCK_SERVICE_TIER_OPTIONS.map((option) => (
                  <SimpleSelectOption key={option.value} value={option.value}>
                    <div>
                      <div css={{ fontWeight: theme.typography.typographyBoldFontWeight }}>{option.value}</div>
                      <div css={{ color: theme.colors.textSecondary, fontSize: theme.typography.fontSizeSm }}>
                        {option.description}
                      </div>
                    </div>
                  </SimpleSelectOption>
                ))}
                <SimpleSelectOption value="custom">
                  <div>
                    <div css={{ fontWeight: theme.typography.typographyBoldFontWeight }}>
                      <FormattedMessage
                        defaultMessage="Custom value"
                        description="Option to enter a custom Bedrock service tier"
                      />
                    </div>
                    <div css={{ color: theme.colors.textSecondary, fontSize: theme.typography.fontSizeSm }}>
                      {customServiceTierDescription}
                    </div>
                  </div>
                </SimpleSelectOption>
              </SimpleSelect>

              {(selectedServiceTierOption || serviceTierSelection === 'custom') && (
                <Typography.Text
                  color="secondary"
                  css={{ display: 'block', marginTop: theme.spacing.sm, fontSize: theme.typography.fontSizeSm }}
                >
                  {selectedServiceTierOption?.description ?? customServiceTierDescription}
                </Typography.Text>
              )}

              {serviceTierSelection === 'custom' && (
                <div css={{ marginTop: theme.spacing.sm }}>
                  <GatewayInput
                    componentId={`${componentId}.service-tier.custom`}
                    value={model.serviceTier}
                    onChange={(e) => onModelChange(index, { serviceTier: e.target.value })}
                    placeholder={intl.formatMessage({
                      defaultMessage: 'Enter a custom service tier',
                      description: 'Placeholder for custom Bedrock service tier input',
                    })}
                  />
                </div>
              )}
            </div>
          )}

          <ApiKeyConfigurator
            value={apiKeyConfig}
            onChange={handleApiKeyChange}
            provider={model.provider}
            existingSecrets={existingSecrets}
            isLoadingSecrets={isLoadingSecrets}
            authModes={authModes}
            defaultAuthMode={defaultAuthMode}
            isLoadingProviderConfig={isLoadingProviderConfig}
            componentId={`${componentId}.api-key`}
          />

          <div css={{ width: 120 }}>
            <FormUI.Label htmlFor={`${domId}.weight`}>
              <FormattedMessage defaultMessage="Weight" description="Label for traffic split weight input" />
            </FormUI.Label>
            <div css={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
              <GatewayInput
                id={`${domId}.weight`}
                componentId={`${componentId}.weight`}
                type="number"
                min={0}
                max={100}
                value={weightInputValue}
                onChange={(e) => {
                  setLocalWeightInput(e.target.value);
                  const parsed = parseInt(e.target.value, 10);
                  onWeightChange(index, Number.isNaN(parsed) ? 0 : parsed);
                }}
                css={{ width: '100%' }}
              />
              <span css={{ color: theme.colors.textSecondary }}>%</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
