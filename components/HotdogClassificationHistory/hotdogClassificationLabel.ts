import type { HotdogTypes } from '@/shared/types';

const HOTDOG_CLASSIFICATION_DATE_TIME_FORMAT = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const HOTDOG_CLASSIFICATION_DATE_FORMAT = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
});

export const formatHotdogClassificationCreatedAt = (createdAt: string) => {
  return HOTDOG_CLASSIFICATION_DATE_TIME_FORMAT.format(new Date(createdAt));
};

export const getHotdogClassificationVerdictLabel = (isHotdog: boolean) => {
  return isHotdog ? 'Hotdog' : 'Not hotdog';
};

/** Detail heading, e.g. "Hotdog · Oct 10, 2026". */
export const getHotdogClassificationDetailTitle = ({
  isHotdog,
  createdAt,
}: HotdogTypes.HotdogClassificationRecord) => {
  return `${getHotdogClassificationVerdictLabel(isHotdog)} · ${HOTDOG_CLASSIFICATION_DATE_FORMAT.format(new Date(createdAt))}`;
};
