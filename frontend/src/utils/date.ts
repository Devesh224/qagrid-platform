import dayjs from 'dayjs';

export function formatDateTime(value: string | null | undefined): string {
  return value ? dayjs(value).format('DD MMM YYYY, HH:mm') : '—';
}
export function toIsoFromLocal(value: string): string {
  return dayjs(value).toISOString();
}
export function localInputDefault(hoursAhead = 1): string {
  const date = dayjs().add(hoursAhead, 'hour').minute(0).second(0).millisecond(0);
  return date.format('YYYY-MM-DDTHH:mm');
}
