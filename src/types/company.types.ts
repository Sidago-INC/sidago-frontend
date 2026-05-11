import { COUNTRY, getRandomCountry } from "./country.types";
import { getRandomTimezone, TIMEZONE } from "./timezone.types";

export type COMPANY = {
  symbol: string;
  name: string;
  timezone: TIMEZONE;
  country: COUNTRY;
  description: string;
  estimatedMarketCap: string;
  primaryVenue: string;
  city: string;
  state: string;
  website: string;
  twitterHandle: string;
  zip: string;
};

export const COMPANY_VALUES: COMPANY[] = [
  {
    symbol: "NTS",
    name: "NovaTech Solutions",
    timezone: "1-EST",
    country: "United States",
    description: "Enterprise automation and data workflow platform.",
    estimatedMarketCap: "$4.2B",
    primaryVenue: "NASDAQ",
    city: "Boston",
    state: "MA",
    website: "https://novatech.example",
    twitterHandle: "@novatech",
    zip: "02110",
  },
  {
    symbol: "BPS",
    name: "BluePeak Systems",
    timezone: "2-CST",
    country: "United States",
    description: "Cloud infrastructure tooling for regional operators.",
    estimatedMarketCap: "$1.8B",
    primaryVenue: "NYSE",
    city: "Austin",
    state: "TX",
    website: "https://bluepeak.example",
    twitterHandle: "@bluepeak",
    zip: "78701",
  },
  {
    symbol: "ZCL",
    name: "ZenithCore Labs",
    timezone: "3-MST",
    country: "Canada",
    description: "Applied research lab focused on customer intelligence.",
    estimatedMarketCap: "$920M",
    primaryVenue: "TSX",
    city: "Calgary",
    state: "AB",
    website: "https://zenithcore.example",
    twitterHandle: "@zenithcore",
    zip: "T2P 1J9",
  },
  {
    symbol: "ARD",
    name: "Aurora Dynamics",
    timezone: "4-PST",
    country: "United States",
    description: "Industrial analytics software for manufacturing teams.",
    estimatedMarketCap: "$2.5B",
    primaryVenue: "NASDAQ",
    city: "Seattle",
    state: "WA",
    website: "https://auroradynamics.example",
    twitterHandle: "@auroradyn",
    zip: "98101",
  },
  {
    symbol: "SBI",
    name: "SkyBridge Innovations",
    timezone: "5-GMT",
    country: "United Kingdom",
    description: "Cross-border payment and compliance products.",
    estimatedMarketCap: "$3.1B",
    primaryVenue: "LSE",
    city: "London",
    state: "England",
    website: "https://skybridge.example",
    twitterHandle: "@skybridge",
    zip: "EC2V 6DN",
  },
  {
    symbol: "PFT",
    name: "PixelForge Technologies",
    timezone: "6-UTC",
    country: "Ireland",
    description: "Creative operations software for distributed media teams.",
    estimatedMarketCap: "$760M",
    primaryVenue: "Euronext Dublin",
    city: "Dublin",
    state: "Leinster",
    website: "https://pixelforge.example",
    twitterHandle: "@pixelforge",
    zip: "D02",
  },
  {
    symbol: "QLS",
    name: "QuantumLeaf Systems",
    timezone: "8-IST",
    country: "India",
    description: "Supply chain planning tools for food and retail brands.",
    estimatedMarketCap: "$1.2B",
    primaryVenue: "NSE",
    city: "Bengaluru",
    state: "KA",
    website: "https://quantumleaf.example",
    twitterHandle: "@quantumleaf",
    zip: "560001",
  },
  {
    symbol: "HPW",
    name: "Hyperion Works",
    timezone: "9-JST",
    country: "Japan",
    description: "Robotics coordination software for logistics networks.",
    estimatedMarketCap: "$5.6B",
    primaryVenue: "TSE",
    city: "Tokyo",
    state: "Tokyo",
    website: "https://hyperionworks.example",
    twitterHandle: "@hyperionworks",
    zip: "100-0001",
  },
  {
    symbol: "CBC",
    name: "CrystalByte Corp",
    timezone: "10-AEST",
    country: "Australia",
    description: "Secure storage and backup products for small businesses.",
    estimatedMarketCap: "$640M",
    primaryVenue: "ASX",
    city: "Sydney",
    state: "NSW",
    website: "https://crystalbyte.example",
    twitterHandle: "@crystalbyte",
    zip: "2000",
  },
  {
    symbol: "ICN",
    name: "IronClad Networks",
    timezone: "1-EST",
    country: "United States",
    description: "Network monitoring and resilience tools.",
    estimatedMarketCap: "$2.9B",
    primaryVenue: "NYSE",
    city: "New York",
    state: "NY",
    website: "https://ironclad.example",
    twitterHandle: "@ironcladnet",
    zip: "10005",
  },
];

export const COMPANY_OPTIONS: { value: COMPANY; label: string }[] =
  COMPANY_VALUES.map((company) => ({
    value: company,
    label: `${company.name} (${company.symbol})`,
  }));

export function getRandomCompany(): COMPANY {
  const randomIndex = Math.floor(Math.random() * COMPANY_VALUES.length);
  return {
    ...COMPANY_VALUES[randomIndex],
    country: getRandomCountry(),
    timezone: getRandomTimezone(),
  };
}
