export type GreetingChannel = 'whatsapp' | 'email' | 'none';
export type GreetingStatus = 'drafted' | 'sent' | 'skipped';

export interface ExtractedContact {
  full_name: string;
  designation: string;
  company_name: string;
  phone_number: string;
  whatsapp_number?: string;
  email: string;
  website: string;
  address: string;
  raw_text: string;
}

export interface ContactRecord extends ExtractedContact {
  id?: number;
  scan_date: string;
  greeting_channel: GreetingChannel;
  greeting_status: GreetingStatus;
}

export type RootStackParamList = {
  Home: undefined;
  Scanner: undefined;
  ContactPreview: { contact: ExtractedContact; isExisting?: boolean };
  GreetingPreview: { contact: ContactRecord };
  History: undefined;
};

