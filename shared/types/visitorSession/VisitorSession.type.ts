export interface CurrentVisitorSessionResponse {
  /** `false` without history consent (guest): nothing is saved for this visitor. */
  isHistoryEnabled: boolean;
  /** Always `false` for guests — onboarding can't be remembered without storage. */
  isOnboardingCompleted: boolean;
}
