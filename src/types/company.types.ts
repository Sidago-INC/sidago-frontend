import { COUNTRY, getRandomCountry } from "./country.types";
import { getRandomTimezone, TIMEZONE } from "./timezone.types";

export type COMPANY = {
  name: string;
  symbol: string;
  country: COUNTRY;
  timezone: TIMEZONE;
};

export const COMPANY_VALUES: COMPANY[] = [
  {
    name: "NovaTech Solutions",
    symbol: "NTS",
    country: getRandomCountry(),
    timezone: getRandomTimezone(),
  },
  {
    name: "BluePeak Systems",
    symbol: "BPS",
    country: getRandomCountry(),
    timezone: getRandomTimezone(),
  },
  {
    name: "ZenithCore Labs",
    symbol: "ZCL",
    country: getRandomCountry(),
    timezone: getRandomTimezone(),
  },
  {
    name: "Aurora Dynamics",
    symbol: "ARD",
    country: getRandomCountry(),
    timezone: getRandomTimezone(),
  },
  {
    name: "SkyBridge Innovations",
    symbol: "SBI",
    country: getRandomCountry(),
    timezone: getRandomTimezone(),
  },
  {
    name: "PixelForge Technologies",
    symbol: "PFT",
    country: getRandomCountry(),
    timezone: getRandomTimezone(),
  },
  {
    name: "QuantumLeaf Systems",
    symbol: "QLS",
    country: getRandomCountry(),
    timezone: getRandomTimezone(),
  },
  {
    name: "Hyperion Works",
    symbol: "HPW",
    country: getRandomCountry(),
    timezone: getRandomTimezone(),
  },
  {
    name: "CrystalByte Corp",
    symbol: "CBC",
    country: getRandomCountry(),
    timezone: getRandomTimezone(),
  },
  {
    name: "IronClad Networks",
    symbol: "ICN",
    country: getRandomCountry(),
    timezone: getRandomTimezone(),
  },
];

export const COMPANY_OPTIONS: { value: COMPANY; label: string }[] =
  COMPANY_VALUES.map((company) => ({
    value: company,
    label: `${company.name} (${company.symbol})`,
  }));

export function getRandomCompany(): COMPANY {
  const randomIndex = Math.floor(Math.random() * COMPANY_VALUES.length);
  return COMPANY_VALUES[randomIndex];
}
