export const PII_POLICY_OPTIONS = [
  'none',
  'detect_mask',
  'detect_redact',
  'detect_report',
  'detect_block',
] as const;

export const PII_POLICY: {
  [key in (typeof PII_POLICY_OPTIONS)[number]]: string;
} = {
  none: 'None',
  detect_mask: 'Detect & Mask',
  detect_redact: 'Detect & Redact',
  detect_report: 'Detect & Report',
  detect_block: 'Detect & Block',
} as const;

type LLMProvider =
  | 'openai'
  | 'anthropic'
  | 'mistral'
  | 'groq'
  | 'perplexity'
  | 'google-generative-ai'
  | 'ollama';

export type LLMProvidersOptionsType = { id: LLMProvider; name: string }[];

export type LLMProvidersType = {
  [key in LLMProvider]: {
    name: string;
    models: LLMModel[];
  };
};

export type LLMConfig = {
  id: string;
  createdAt: number;
  provider: LLMProvider;
  tenant: string;
  models: string[];
  terminusToken: string;
  apiKey?: string;
  baseURL?: string;
  isChatWithPDFProvider?: boolean;
};

export type LLMModel = {
  id: string;
  name: string;
  max_tokens?: number;
};

export type LLMConversation = {
  id: string;
  tenant: string;
  userId: string;
  title: string;
  provider: string;
  model: string;
  isChatWithPDFProvider?: boolean;
  createdAt: number;
};

export type LLMChat = {
  role: string;
  content: string;
  id: string;
  conversationId: string;
  createdAt: string;
};

export enum SupportedLanguages {
  English = 'en',
  Spanish = 'es',
  German = 'de',
}

export type LanguageKey = keyof typeof SupportedLanguages;

type DescriptionKey =
  | 'AU_ABN'
  | 'AU_ACN'
  | 'AU_TFN'
  | 'AU_MEDICARE'
  | 'IN_AADHAAR'
  | 'IN_PAN'
  | 'IN_PASSPORT'
  | 'IN_VOTER'
  | 'IN_VEHICLE_REGISTRATION'
  | 'SG_NRIC_FIN'
  | 'UK_NHS'
  | 'US_ITIN'
  | 'US_PASSPORT'
  | 'US_SSN'
  | 'US_BANK_NUMBER'
  | 'US_DRIVER_LICENSE'
  | 'IP_ADDRESS'
  | 'IBAN_CODE'
  | 'NRP'
  | 'CREDIT_CARD'
  | 'URL'
  | 'LOCATION'
  | 'EMAIL_ADDRESS'
  | 'MEDICAL_LICENSE'
  | 'PERSON'
  | 'DATE_TIME'
  | 'PHONE_NUMBER'
  | 'ORGANIZATION'
  | 'CRYPTO';

// Create a constant object with descriptions
export const descriptions: Record<DescriptionKey, string> = {
  AU_ABN: 'Australian Business Number, a unique identifier for businesses in Australia.',
  AU_ACN: 'Australian Company Number, a unique identifier for companies in Australia.',
  AU_TFN: 'Tax File Number, used for tax purposes in Australia.',
  AU_MEDICARE: 'Medicare card number for health services in Australia.',
  IN_AADHAAR: 'Aadhaar number, a unique identification number issued in India.',
  IN_PAN: 'Permanent Account Number, used for tax identification in India.',
  IN_PASSPORT: 'Passport number for international travel from India.',
  IN_VOTER: 'Voter ID number used for electoral purposes in India.',
  IN_VEHICLE_REGISTRATION: 'Vehicle registration number in India.',
  SG_NRIC_FIN: 'National Registration Identity Card/Foreign Identification Number in Singapore.',
  UK_NHS: 'National Health Service number in the United Kingdom.',
  US_ITIN: 'Individual Taxpayer Identification Number issued by the IRS.',
  US_PASSPORT: 'Passport number for international travel issued by the U.S.',
  US_SSN: 'Social Security Number format: XXX-XX-XXXX',
  US_BANK_NUMBER: 'Bank account numbers used for transactions.',
  US_DRIVER_LICENSE: "Driver's license numbers issued by U.S. states.",
  IP_ADDRESS: 'An identifier for a device on a TCP/IP network.',
  IBAN_CODE: 'International Bank Account Number, used to identify bank accounts internationally.',
  NRP: 'National Registration Profile, used for various identification purposes.',
  CREDIT_CARD: 'A card issued by a financial institution allowing the holder to borrow funds.',
  URL: 'Uniform Resource Locator, used to specify addresses on the internet.',
  LOCATION: 'Geographical coordinates or address indicating a specific place.',
  EMAIL_ADDRESS: 'A unique identifier for an email account.',
  MEDICAL_LICENSE: 'License required to practice medicine legally.',
  PERSON: 'An individual human being.',
  DATE_TIME: 'A representation of date and time.',
  PHONE_NUMBER: 'A sequence of digits assigned to a telephone line.',
  ORGANIZATION: 'A group of people organized for a particular purpose.',
  CRYPTO: 'Refers to cryptocurrencies or cryptographic assets.',
} as const;
