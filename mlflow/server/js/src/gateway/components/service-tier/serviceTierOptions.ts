export const SERVICE_TIER_OPTIONS = [
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

export type ServiceTierOption = (typeof SERVICE_TIER_OPTIONS)[number]['value'];

export function isPresetServiceTier(value: string): value is ServiceTierOption {
  return SERVICE_TIER_OPTIONS.some((opt) => opt.value === value);
}

/** Returns the selection state for a given persisted service tier value. */
export function getServiceTierSelection(value: string): ServiceTierOption | 'custom' | undefined {
  if (!value) return undefined;
  return isPresetServiceTier(value) ? value : 'custom';
}
