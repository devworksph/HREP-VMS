export interface CreateVisitorResponse {
  success?: boolean;
  visitor_id?: number | string;
  booking_id?: string;
  message?: string;
}

export interface ApiValidationError {
  status: false;
  errors?: Record<string, string>;
  message?: string;
}

export interface UploadResponse {
  status: boolean;
  file?: string;
  message?: string;
}

export interface RemindersResponse {
  reminders: string;
}

export interface PrivacyPolicyResponse {
  privacy_policy: string;
}

export interface Holiday {
  date: string;
  name: string;
}

export interface HolidaysResponse {
  holidays: Holiday[];
}

export interface AvailabilityResponse {
  enforced: boolean;
  unavailable: string[];
  full: string[];
}

export interface SlotAvailability {
  hour: number;
  remaining: number;
}

export interface SlotsResponse {
  enforced: boolean;
  slots: SlotAvailability[];
}
