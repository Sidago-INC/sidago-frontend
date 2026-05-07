const TIMEZONE_VALUES = [
  "1-EST",
  "2-CST",
  "3-MST",
  "4-PST",
  "5-GMT",
  "6-UTC",
  "7-BST",
  "8-IST",
  "9-JST",
  "10-AEST",
] as const;

export type TIMEZONE = (typeof TIMEZONE_VALUES)[number];

export const TIMEZONE_OPTIONS: { value: TIMEZONE; label: string }[] =
  TIMEZONE_VALUES.map((tz) => ({
    value: tz,
    label: tz,
  }));

export function getRandomTimezone(): TIMEZONE {
  const randomIndex = Math.floor(Math.random() * TIMEZONE_VALUES.length);
  return TIMEZONE_VALUES[randomIndex];
}