import type { SharedTypes } from '@/shared/types';
import { useTranslations } from 'next-intl';

import type { HotdogClassificationErrorKey } from './hotdogClassificationFailure';

/** Translates an error key (API `errorCode` or a client-only fallback) from the `errors` messages. */
export const useApiErrorMessage = () => {
  const translateError = useTranslations('errors');

  return ({
    errorKey,
    errorValues,
  }: {
    errorKey: HotdogClassificationErrorKey;
    errorValues?: SharedTypes.ApiErrorValues;
  }) => translateError(errorKey, errorValues);
};
