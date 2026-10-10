'use client';

import { useVisitorPrivacy } from '@/hooks/useVisitorPrivacy';

import HotdogClassificationWorkspaceLayout from './HotdogClassificationWorkspaceLayout';

/**
 * Remounts the whole workspace (classifier back to idle, history reloaded) after the
 * visitor's data is erased. The privacy provider then moves focus to the page heading.
 */
const HotdogClassificationWorkspace = () => {
  const { dataResetCount } = useVisitorPrivacy();

  return <HotdogClassificationWorkspaceLayout key={dataResetCount} />;
};

export default HotdogClassificationWorkspace;
