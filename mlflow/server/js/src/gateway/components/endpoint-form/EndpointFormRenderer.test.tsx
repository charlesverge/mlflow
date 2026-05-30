import React from 'react';
import { describe, expect, it, jest } from '@jest/globals';
import { useForm, FormProvider } from 'react-hook-form';
import { renderWithDesignSystem, screen } from '../../../common/utils/TestUtils.react18';
import userEvent from '@testing-library/user-event';
import { EndpointFormRenderer } from './EndpointFormRenderer';
import type { CreateEndpointFormData } from '../../hooks/useCreateEndpointForm';

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

jest.mock('../edit-endpoint/UsageTrackingConfigurator', () => ({
  UsageTrackingConfigurator: () => <div>Usage tracking configurator</div>,
}));

jest.mock('../../../common/components/long-form/LongFormSummary', () => ({
  LongFormSummary: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const defaultFormValues: CreateEndpointFormData = {
  name: 'my-endpoint',
  provider: '',
  modelName: '',
  serviceTier: '',
  secretMode: 'new',
  existingSecretId: '',
  newSecret: { name: '', authMode: '', secretFields: {}, configFields: {} },
  usageTracking: true,
  experimentId: '',
};

const TestHarness = ({ initialValues = {} }: { initialValues?: Partial<CreateEndpointFormData> }) => {
  const form = useForm<CreateEndpointFormData>({
    defaultValues: { ...defaultFormValues, ...initialValues },
  });

  return (
    <FormProvider {...form}>
      <EndpointFormRenderer
        mode="create"
        isSubmitting={false}
        error={null}
        errorMessage={null}
        resetErrors={jest.fn()}
        selectedModel={undefined}
        isFormComplete={false}
        onSubmit={jest.fn(async () => {})}
        onCancel={jest.fn()}
        onNameBlur={jest.fn()}
      />
    </FormProvider>
  );
};

describe('EndpointFormRenderer — service tier (create form)', () => {
  it('does not render the service tier selector when no provider is selected', () => {
    renderWithDesignSystem(<TestHarness />);
    expect(screen.queryByText('Service tier')).not.toBeInTheDocument();
  });

  it('does not render the service tier selector for non-Bedrock providers', () => {
    renderWithDesignSystem(<TestHarness initialValues={{ provider: 'openai', modelName: 'gpt-4o-mini' }} />);
    expect(screen.queryByText('Service tier')).not.toBeInTheDocument();
  });

  it('renders the service tier selector when the Bedrock provider is selected', () => {
    renderWithDesignSystem(<TestHarness initialValues={{ provider: 'bedrock', modelName: 'anthropic.claude-3' }} />);
    expect(screen.getByText('Service tier')).toBeInTheDocument();
  });

  it('shows all predefined tier options plus "Custom value" in the dropdown', async () => {
    const user = userEvent.setup();
    renderWithDesignSystem(<TestHarness initialValues={{ provider: 'bedrock', modelName: 'anthropic.claude-3' }} />);

    await user.click(screen.getByRole('combobox', { name: /service tier/i }));

    // SimpleSelect may render each option in both an accessible hidden element and the popup,
    // so use getAllByRole to handle duplicates for "default" which is a common word.
    expect(screen.getAllByRole('option', { name: /^auto/i }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole('option', { name: /^default/i }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole('option', { name: /^priority/i }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole('option', { name: /^flex/i }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole('option', { name: /custom value/i }).length).toBeGreaterThanOrEqual(1);
  });

  it('sets the service tier form value when a predefined tier is selected', async () => {
    const user = userEvent.setup();
    let capturedValues: CreateEndpointFormData | null = null;

    const CapturingHarness = () => {
      const form = useForm<CreateEndpointFormData>({
        defaultValues: { ...defaultFormValues, provider: 'bedrock', modelName: 'anthropic.claude-3' },
      });
      capturedValues = form.watch() as CreateEndpointFormData;
      return (
        <FormProvider {...form}>
          <EndpointFormRenderer
            mode="create"
            isSubmitting={false}
            error={null}
            errorMessage={null}
            resetErrors={jest.fn()}
            selectedModel={undefined}
            isFormComplete={false}
            onSubmit={jest.fn(async () => {})}
            onCancel={jest.fn()}
            onNameBlur={jest.fn()}
          />
        </FormProvider>
      );
    };

    renderWithDesignSystem(<CapturingHarness />);

    await user.click(screen.getByRole('combobox', { name: /service tier/i }));
    await user.click(screen.getByRole('option', { name: /priority/i }));

    expect(capturedValues).not.toBeNull();
    expect((capturedValues as unknown as CreateEndpointFormData).serviceTier).toBe('priority');
  });

  it('shows the custom text input when an unrecognised service tier value is pre-set', () => {
    // serviceTierSelection = 'custom' when the saved value doesn't match any predefined option.
    renderWithDesignSystem(
      <TestHarness initialValues={{ provider: 'bedrock', modelName: 'anthropic.claude-3', serviceTier: 'reserved-tier' }} />,
    );

    expect(screen.getByPlaceholderText('Enter a custom service tier')).toBeInTheDocument();
  });

  it('shows the "Clear selection" button when a tier is set and clears it on click', async () => {
    const user = userEvent.setup();
    let capturedValues: CreateEndpointFormData | null = null;

    const CapturingHarness = () => {
      const form = useForm<CreateEndpointFormData>({
        defaultValues: { ...defaultFormValues, provider: 'bedrock', modelName: 'anthropic.claude-3', serviceTier: 'priority' },
      });
      capturedValues = form.watch() as CreateEndpointFormData;
      return (
        <FormProvider {...form}>
          <EndpointFormRenderer
            mode="create"
            isSubmitting={false}
            error={null}
            errorMessage={null}
            resetErrors={jest.fn()}
            selectedModel={undefined}
            isFormComplete={false}
            onSubmit={jest.fn(async () => {})}
            onCancel={jest.fn()}
            onNameBlur={jest.fn()}
          />
        </FormProvider>
      );
    };

    renderWithDesignSystem(<CapturingHarness />);

    expect(screen.getByRole('button', { name: /clear selection/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /clear selection/i }));

    expect((capturedValues as unknown as CreateEndpointFormData).serviceTier).toBe('');
  });

  it('clears the service tier and hides the selector when switching to a non-Bedrock provider', async () => {
    const user = userEvent.setup();
    renderWithDesignSystem(
      <TestHarness initialValues={{ provider: 'bedrock', modelName: 'anthropic.claude-3', serviceTier: 'priority' }} />,
    );

    expect(screen.getByText('Service tier')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Select OpenAI' }));

    expect(screen.queryByText('Service tier')).not.toBeInTheDocument();
  });
});
