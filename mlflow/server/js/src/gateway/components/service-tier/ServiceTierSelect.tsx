import { useState, useRef, useCallback } from 'react';
import { Input, useDesignSystemTheme, FormUI } from '@databricks/design-system';
import { FormattedMessage, useIntl } from 'react-intl';
import { ServiceTierSelectorModal } from './ServiceTierSelectorModal';

interface ServiceTierSelectProps {
  provider: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  /** Component ID for telemetry (default: 'mlflow.gateway.service-tier-select') */
  componentId?: string;
}

export const ServiceTierSelect = ({
  provider,
  value,
  onChange,
  error,
  componentId = 'mlflow.gateway.service-tier-select',
}: ServiceTierSelectProps) => {
  const { theme } = useDesignSystemTheme();
  const intl = useIntl();
  const domId = useRef(`service-tier-select-${Math.random().toString(36).slice(2, 9)}`).current;
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClick = useCallback(() => {
    if (provider) {
      setIsModalOpen(true);
    }
  }, [provider]);

  const handleSelect = useCallback(
    (tier: string) => {
      onChange(tier);
    },
    [onChange],
  );

  const handleClose = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  return (
    <div>
      <FormUI.Label htmlFor={domId}>
        <FormattedMessage defaultMessage="Service tier" description="Label for service tier select field" />
      </FormUI.Label>
      <Input
        id={domId}
        componentId={componentId}
        placeholder={
          !provider
            ? intl.formatMessage({
                defaultMessage: 'Select a provider first',
                description: 'Placeholder when no provider selected for service tier',
              })
            : intl.formatMessage({
                defaultMessage: 'Click to select a service tier (optional)',
                description: 'Placeholder for service tier selection',
              })
        }
        readOnly
        disabled={!provider}
        onClick={handleClick}
        value={value || ''}
        validationState={error ? 'error' : undefined}
        css={{
          cursor: !provider ? 'not-allowed' : 'pointer',
          '& input': {
            cursor: !provider ? 'not-allowed' : 'pointer',
          },
        }}
      />
      {error && <FormUI.Message type="error" message={error} />}
      <ServiceTierSelectorModal
        isOpen={isModalOpen}
        onClose={handleClose}
        onSelect={handleSelect}
        initialValue={value}
      />
    </div>
  );
};
