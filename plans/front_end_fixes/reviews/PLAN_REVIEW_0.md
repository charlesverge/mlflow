# Plan Completion Review – PLAN_FRONT_END_FIXES.md
**Review index**: 0  
**Date**: 2025-07-16  
**Reviewer**: Copilot (plan-completion-review skill)

---

## 1. Tests and Linters

**Test run** (all 42 tests in scope pass):

| Suite | Tests | Status |
|---|---|---|
| `ServiceTierSelect.test.tsx` | 7 | ✅ PASS |
| `ServiceTierSelectorModal.test.tsx` | 13 | ✅ PASS |
| `EndpointFormRenderer.test.tsx` | 10 | ✅ PASS |
| `TrafficSplitModelItem.test.tsx` | 8 | ✅ PASS |
| `EditEndpointFormRenderer.test.tsx` | 4 | ✅ PASS (pre-existing, not modified) |

**Linter**: Not run explicitly during this review. No new ESLint-disabling comments or type suppressions were introduced. All imports are used; removed `useRef`, `useMemo`, `SimpleSelect`, `SimpleSelectOption` from both form files.

---

## 2. Unexpected Side Effects

- `EndpointFormRenderer.tsx`: Removed `useRef` and `SimpleSelect`/`SimpleSelectOption` imports. No other callers of these were touched.
- `TrafficSplitModelItem.tsx`: Removed `useMemo` and `SimpleSelect`/`SimpleSelectOption`. No other callers affected.
- `serviceTier` is already reset to `''` in the existing provider-change handlers in both form files — no change to clearing logic was needed.
- No global state mutations, hidden I/O, or unsafe retries were introduced.

---

## 3. Feature Checklist

| # | Feature (from plan) | Status |
|---|---|---|
| 1 | Create `ServiceTierSelect` trigger component | ✅ Complete |
| 2 | Create `ServiceTierSelectorModal` component | ✅ Complete |
| 3 | Centralize tier constants in `serviceTierOptions.ts` | ✅ Complete |
| 4 | Barrel `index.ts` for the new components | ✅ Complete |
| 5 | Replace inline `SimpleSelect` in `EndpointFormRenderer.tsx` | ✅ Complete |
| 6 | Replace inline `SimpleSelect` in `TrafficSplitModelItem.tsx` | ✅ Complete |
| 7 | Remove `provider === 'bedrock'` guard in both forms | ✅ Complete |
| 8 | Update `EndpointFormRenderer.test.tsx` for modal behavior | ✅ Complete |
| 9 | Update `TrafficSplitModelItem.test.tsx` for modal behavior | ✅ Complete |
| 10 | New `ServiceTierSelect.test.tsx` | ✅ Complete |
| 11 | New `ServiceTierSelectorModal.test.tsx` | ✅ Complete |

---

## 4. Plan Validity

The plan is coherent and maps directly to the stated goal. Each file listed in the plan table has been created or modified as specified. The acceptance criteria map 1:1 to the implemented behavior.

---

## 5. Code Completes the Goal

- **All-provider visibility**: `ServiceTierSelect` is now rendered unconditionally (disabled only when `provider` is empty) in both `EndpointFormRenderer` and `TrafficSplitModelItem`. The `provider === 'bedrock'` gate is gone.
- **Modal pattern**: Trigger input opens `ServiceTierSelectorModal`; no inline `SimpleSelect`.
- **Pre-population**: `initialValue` prop drives a `useEffect` that populates either `selectedTier` (preset) or `customValue` (unrecognised string) when the modal opens.
- **Clear inside modal**: "Clear selection" button appears only when `hasCurrentSelection`; calls `onSelect('')` + `onClose()`.
- **Custom input**: Dedicated input section with mutual exclusivity against preset radio selection.
- **Visual consistency**: Option rows use a uniform `padding` / `flex` layout instead of `SimpleSelectOption` indentation.

---

## 6. Missing Items

**None** relative to the plan's explicit scope.

**Potential gap (out of scope)**: `EditEndpointFormRenderer.test.tsx` (the edit-endpoint *page-level* renderer test) has a mocked `TrafficSplitConfigurator` that still renders "Primary service tier visible" only for Bedrock models. This mock reflects the old behavior. The *real* `TrafficSplitConfigurator` delegates to `TrafficSplitModelItem`, which now uses `ServiceTierSelect` for all providers — so the runtime behavior is correct. However, the mock in that test file was not updated to reflect all-provider visibility. This is low risk (test of a mock, not the real implementation), but could mislead future developers.

---

## 7. Incomplete Items

None. All planned files have been created/modified and all tests pass.

---

## 8. Execution Risks

All identified risks were resolved during implementation:

| Risk | Resolution |
|---|---|
| `Radio.Group name` ≠ ARIA group label | Pre-population tests use "Clear selection" button and confirm-button state instead of `getByRole('group', {name})` |
| Emotion CSS opacity not testable via `toHaveStyle` | Replaced with behavioral assertion: custom input is `disabled` when a preset is active |
| `TrafficSplitModelItem` starts expanded when both `provider` and `modelName` are empty | No-provider test removed `expandModel` call; component is already expanded |

No execution path currently raises uncaught exceptions or returns incorrect data.

---

## 9. Questions

1. **`EditEndpointFormRenderer.test.tsx` mock**: Should the `TrafficSplitConfigurator` mock be updated to assert all-provider service tier visibility? Currently it still simulates Bedrock-only — the test passes (it's a pre-existing non-plan file) but misrepresents the new behavior.
2. **Provider-specific presets**: The plan notes this is out of scope, but future providers may need different tier lists. `serviceTierOptions.ts` could be extended with a `getServiceTierOptionsForProvider(provider)` function later.

---

## 10. Suggested Improvements

### High priority (directly serves plan goals)

1. **Update `EditEndpointFormRenderer.test.tsx` mock** to reflect all-provider service tier visibility. Change:
   ```tsx
   // OLD: Only shows for Bedrock
   <div>{value.some((m) => m.provider === 'bedrock') ? 'Primary service tier visible' : 'Primary service tier hidden'}</div>
   // NEW: Always visible when any provider is present
   <div>{value.some((m) => m.provider) ? 'Primary service tier visible' : 'Primary service tier hidden'}</div>
   ```
   Update the two existing assertions accordingly.

### Low priority (nice-to-have)

2. **Show human-readable tier label in the trigger input** instead of the raw value (e.g., "Priority – lower latency" instead of `priority`). Currently the raw value is shown, which is functional but less polished.
3. **Add `aria-label` to `ServiceTierSelect`** wrapper `<div>` for screen-reader identification of the entire field group.

---

## 11. Migration

No backend API changes. No schema updates. No data migration required. The `serviceTier` / `service_tier` field already existed in both create and edit flows; only the UI presentation changed.

---

## 12. Assumptions

- "Primary-model edit card" in acceptance criteria 1 refers to `EndpointFormRenderer` in `mode="edit"` (which now renders `ServiceTierSelect` for all providers), **not** `EditEndpointFormRenderer.tsx` (page-level renderer that delegates down to `TrafficSplitModelItem`).
- The existing provider-change reset of `serviceTier = ''` in both forms is sufficient — no additional clearing logic is needed in `ServiceTierSelect`.
- `getServiceTierSelection` helper in `serviceTierOptions.ts` was created per the plan but is not yet used by any component. It is exported for future use.

---

## 13. Verification Steps

1. Run `npm test -- --testPathPattern="service-tier|EndpointFormRenderer|TrafficSplitModelItem" --no-coverage` — expect 42/42 tests passing.
2. Start the dev server and navigate to the create-endpoint form. Select any provider (not just Bedrock). Verify the "Service tier" field is present and clickable.
3. Click the service tier field. Verify the modal opens with all four preset options and a custom input.
4. Select "priority" and confirm. Verify the trigger input shows `priority`.
5. Reopen the modal — verify `priority` is pre-selected (confirm button enabled, "Clear selection" visible).
6. Click "Clear selection" — verify the modal closes and the trigger input is blank.
7. Switch provider. Verify the service tier field is reset and still visible.
8. Repeat steps 2–7 in the edit-endpoint traffic-split model card (`TrafficSplitModelItem`).

---

## 14. Changes Required

### Required (to fully align tests with new all-provider behavior)

**File**: `mlflow/server/js/src/gateway/components/edit-endpoint/EditEndpointFormRenderer.test.tsx`

- **What**: The mocked `TrafficSplitConfigurator` on ~line 12 still uses `provider === 'bedrock'` to decide whether to show service tier. This does not reflect the new all-provider behavior.
- **Change**: Replace the Bedrock check in the mock's JSX with a check for any provider being present (e.g., `value.some((m) => m.provider)`). Update the two test assertions that reference "Primary service tier visible" / "Primary service tier hidden" to match.

---

## 15. Summary

**Estimated plan completion: 97%**

All planned files have been created or modified, all 42 tests pass, and the acceptance criteria are satisfied. The 3% gap is the `EditEndpointFormRenderer.test.tsx` mock that still reflects old Bedrock-only service tier visibility — the runtime behavior is correct, but the test mock lags behind the new behavior.
