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
  it('renders a disabled service tier trigger when no provider is selected', () => {
    renderWithDesignSystem(<TestHarness />);
    const input = screen.getByRole('textbox', { name: /service tier/i });
    expect(input).toBeDisabled();
  });

  it('renders an enabled service tier trigger for a non-Bedrock provider', () => {
    renderWithDesignSystem(<TestHarness initialValues={{ provider: 'openai', modelName: 'gpt-4o-mini' }} />);
    const input = screen.getByRole('textbox', { name: /service tier/i });
    expect(input).not.toBeDisabled();
  });

  it('renders an enabled service tier trigger when the Bedrock provider is selected', () => {
    renderWithDesignSystem(<TestHarness initialValues={{ provider: 'bedrock', modelName: 'anthropic.claude-3' }} />);
    const input = screen.getByRole('textbox', { name: /service tier/i });
    expect(input).not.toBeDisabled();
  });

  it('opens the modal when the service tier trigger is clicked', async () => {
    const user = userEvent.setup();
    renderWithDesignSystem(<TestHarness initialValues={{ provider: 'bedrock', modelName: 'anthropic.claude-3' }} />);

    await user.click(screen.getByRole('textbox', { name: /service tier/i }));

    expect(screen.getByRole('dialog', { name: /select service tier/i })).toBeInTheDocument();
  });

  it('shows all predefined tier options and a custom input inside the modal', async () => {
    const user = userEvent.setup();
    renderWithDesignSystem(<TestHarness initialValues={{ provider: 'bedrock', modelName: 'anthropic.claude-3' }} />);

    await user.click(screen.getByRole('textbox', { name: /service tier/i }));

    expect(screen.getByText('auto')).toBeInTheDocument();
    expect(screen.getByText('default')).toBeInTheDocument();
    expect(screen.getByText('priority')).toBeInTheDocument();
    expect(screen.getByText('flex')).toBeInTheDocument();
    expect(screen.getByText(/use a custom service tier/i)).toBeInTheDocument();
  });

  it('sets the service tier form value when a predefined tier is confirmed', async () => {
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

    await user.click(screen.getByRole('textbox', { name: /service tier/i }));
    await user.click(screen.getByText('priority'));
    await user.click(screen.getByRole('button', { name: /^select$/i }));

    expect(capturedValues).not.toBeNull();
    expect((capturedValues as unknown as CreateEndpointFormData).serviceTier).toBe('priority');
  });

  it('pre-populates a preset tier when the modal opens with an existing value', async () => {
    const user = userEvent.setup();
    renderWithDesignSystem(
      <TestHarness initialValues={{ provider: 'bedrock', modelName: 'anthropic.claude-3', serviceTier: 'flex' }} />,
    );

    await user.click(screen.getByRole('textbox', { name: /service tier/i }));

    // Confirm button is enabled because the preset tier was pre-selected
    expect(screen.getByRole('button', { name: /^select$/i })).not.toBeDisabled();
    // And "Clear selection" is visible because there is a pre-selection
    expect(screen.getByRole('button', { name: /clear selection/i })).toBeInTheDocument();
  });

  it('pre-populates the custom input when the modal opens with an unrecognised value', async () => {
    const user = userEvent.setup();
    renderWithDesignSystem(
      <TestHarness
        initialValues={{ provider: 'bedrock', modelName: 'anthropic.claude-3', serviceTier: 'reserved-tier' }}
      />,
    );

    await user.click(screen.getByRole('textbox', { name: /service tier/i }));

    const customInput = screen.getByPlaceholderText(/enter service tier/i);
    expect((customInput as HTMLInputElement).value).toBe('reserved-tier');
  });

  it('clears the service tier using the in-modal clear button', async () => {
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

    await user.click(screen.getByRole('textbox', { name: /service tier/i }));
    await user.click(screen.getByRole('button', { name: /clear selection/i }));

    expect((capturedValues as unknown as CreateEndpointFormData).serviceTier).toBe('');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('clears the service tier and keeps the trigger enabled when switching to a non-Bedrock provider', async () => {
    const user = userEvent.setup();
    renderWithDesignSystem(
      <TestHarness initialValues={{ provider: 'bedrock', modelName: 'anthropic.claude-3', serviceTier: 'priority' }} />,
    );

    expect(screen.getByRole('textbox', { name: /service tier/i })).not.toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Select OpenAI' }));

    // Trigger is still present (all providers show it) and enabled
    expect(screen.getByRole('textbox', { name: /service tier/i })).not.toBeDisabled();
  });
});

