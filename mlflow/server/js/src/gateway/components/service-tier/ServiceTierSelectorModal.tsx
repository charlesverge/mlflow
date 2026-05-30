import { useState, useCallback, useEffect } from 'react';
import { useIntl, FormattedMessage } from 'react-intl';
import {
  Button,
  Input,
  Modal,
  Radio,
  Typography,
  useDesignSystemTheme,
  XCircleFillIcon,
} from '@databricks/design-system';
import type { RadioChangeEvent } from '@databricks/design-system';
import { SERVICE_TIER_OPTIONS, isPresetServiceTier } from './serviceTierOptions';
import type { ServiceTierOption } from './serviceTierOptions';

interface ServiceTierSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called with the confirmed value (empty string means clear). */
  onSelect: (value: string) => void;
  /** Current value from the form — used to pre-populate the modal. */
  initialValue?: string;
}

export const ServiceTierSelectorModal = ({ isOpen, onClose, onSelect, initialValue }: ServiceTierSelectorModalProps) => {
  const intl = useIntl();
  const { theme: dsTheme } = useDesignSystemTheme();

  const [selectedTier, setSelectedTier] = useState<ServiceTierOption | null>(null);
  const [customValue, setCustomValue] = useState('');

  const isCustomMode = customValue.trim().length > 0;

  // Pre-populate from the current form value when the modal opens.
  useEffect(() => {
    if (!isOpen) {
      setSelectedTier(null);
      setCustomValue('');
      return;
    }

    if (!initialValue) {
      return;
    }

    if (isPresetServiceTier(initialValue)) {
      setSelectedTier(initialValue);
      setCustomValue('');
    } else {
      setSelectedTier(null);
      setCustomValue(initialValue);
    }
  }, [isOpen, initialValue]);

  const handleClose = useCallback(() => {
    setSelectedTier(null);
    setCustomValue('');
    onClose();
  }, [onClose]);

  const handleTierSelect = useCallback((value: ServiceTierOption) => {
    setSelectedTier(value);
    setCustomValue('');
  }, []);

  const handleCustomValueChange = useCallback((value: string) => {
    setCustomValue(value);
    if (value.trim()) {
      setSelectedTier(null);
    }
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedTier(null);
    setCustomValue('');
    onSelect('');
    onClose();
  }, [onSelect, onClose]);

  const handleConfirm = useCallback(() => {
    if (isCustomMode) {
      onSelect(customValue.trim());
    } else if (selectedTier) {
      onSelect(selectedTier);
    }
    handleClose();
  }, [isCustomMode, customValue, selectedTier, onSelect, handleClose]);

  const isConfirmDisabled = isCustomMode ? !customValue.trim() : !selectedTier;
  const hasCurrentSelection = Boolean(selectedTier || isCustomMode);

  return (
    <Modal
      componentId="mlflow.gateway.service-tier-selector-modal"
      title={intl.formatMessage({
        defaultMessage: 'Select service tier',
        description: 'Service tier selector modal title',
      })}
      visible={isOpen}
      onCancel={handleClose}
      size="normal"
      footer={
        <div css={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div>
            {hasCurrentSelection && (
              <Button
                componentId="mlflow.gateway.service-tier-selector-modal.clear"
                type="tertiary"
                onClick={handleClearSelection}
              >
                <FormattedMessage defaultMessage="Clear selection" description="Clear service tier selection" />
              </Button>
            )}
          </div>
          <div css={{ display: 'flex', gap: dsTheme.spacing.sm }}>
            <Button componentId="mlflow.gateway.service-tier-selector-modal.cancel" onClick={handleClose}>
              {intl.formatMessage({ defaultMessage: 'Cancel', description: 'Cancel button' })}
            </Button>
            <Button
              componentId="mlflow.gateway.service-tier-selector-modal.confirm"
              type="primary"
              disabled={isConfirmDisabled}
              onClick={handleConfirm}
            >
              {intl.formatMessage({ defaultMessage: 'Select', description: 'Select button' })}
            </Button>
          </div>
        </div>
      }
    >
      <div css={{ display: 'flex', flexDirection: 'column', gap: dsTheme.spacing.md }}>
        {/* Predefined tier list */}
        <div
          css={{
            border: `1px solid ${dsTheme.colors.borderDecorative}`,
            borderRadius: dsTheme.general.borderRadiusBase,
            overflow: 'hidden',
            opacity: isCustomMode ? 0.5 : 1,
            pointerEvents: isCustomMode ? 'none' : 'auto',
            transition: 'opacity 0.2s ease',
          }}
        >
          <Radio.Group
            name="service-tier-selector"
            componentId="mlflow.gateway.service-tier-selector-modal.radio-group"
            value={selectedTier ?? ''}
            onChange={(e: RadioChangeEvent) => handleTierSelect(e.target.value as ServiceTierOption)}
            css={{ width: '100%' }}
          >
            {SERVICE_TIER_OPTIONS.map((option) => (
              <div
                key={option.value}
                onClick={() => handleTierSelect(option.value)}
                css={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: dsTheme.spacing.sm,
                  padding: `${dsTheme.spacing.sm}px ${dsTheme.spacing.md}px`,
                  cursor: 'pointer',
                  backgroundColor:
                    selectedTier === option.value ? dsTheme.colors.actionTertiaryBackgroundPress : 'transparent',
                  '&:hover': {
                    backgroundColor:
                      selectedTier === option.value
                        ? dsTheme.colors.actionTertiaryBackgroundPress
                        : dsTheme.colors.actionTertiaryBackgroundHover,
                  },
                  borderBottom: `1px solid ${dsTheme.colors.borderDecorative}`,
                  '&:last-child': { borderBottom: 'none' },
                }}
              >
                <Radio value={option.value} css={{ marginTop: 2 }} />
                <div>
                  <Typography.Text bold>{option.value}</Typography.Text>
                  <Typography.Text
                    color="secondary"
                    css={{ display: 'block', fontSize: dsTheme.typography.fontSizeSm }}
                  >
                    {option.description}
                  </Typography.Text>
                </div>
              </div>
            ))}
          </Radio.Group>
        </div>

        {/* Divider */}
        <div css={{ display: 'flex', alignItems: 'center', gap: dsTheme.spacing.md }}>
          <div css={{ flex: 1, height: 1, backgroundColor: dsTheme.colors.borderDecorative }} />
          <Typography.Text color="secondary" size="sm">
            <FormattedMessage defaultMessage="or" description="Divider between tier list and custom input" />
          </Typography.Text>
          <div css={{ flex: 1, height: 1, backgroundColor: dsTheme.colors.borderDecorative }} />
        </div>

        {/* Custom tier input */}
        <div
          css={{
            display: 'flex',
            flexDirection: 'column',
            gap: dsTheme.spacing.xs,
            opacity: selectedTier ? 0.5 : 1,
            transition: 'opacity 0.2s ease',
          }}
        >
          <Typography.Text bold>
            <FormattedMessage
              defaultMessage="Use a custom service tier"
              description="Label for custom service tier input section"
            />
          </Typography.Text>
          <Input
            componentId="mlflow.gateway.service-tier-selector-modal.custom-tier"
            placeholder={intl.formatMessage({
              defaultMessage: 'Enter service tier...',
              description: 'Placeholder for custom service tier input',
            })}
            value={customValue}
            onChange={(e) => handleCustomValueChange(e.target.value)}
            disabled={Boolean(selectedTier)}
          />
          <Typography.Text color="secondary" size="sm">
            <FormattedMessage
              defaultMessage="Enter a service tier value not listed above."
              description="Help text for custom service tier input"
            />
          </Typography.Text>
        </div>
      </div>
    </Modal>
  );
};
