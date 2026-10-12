export type EditorRole = 'ADMIN' | 'REVIEWER' | 'SALES';

export type EditorMode = 'add' | 'edit';

export type DraftSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface ReviewerOption {
  id: string;
  name: string;
  email?: string;
}

export interface MerchantApplication {
  id?: string;
  business_name: string;
  legal_business_name: string;
  business_type: string;
  owner_name: string;
  owner_email: string;
  owner_phone: string;
  processing_volume: number | null;
  processing_currency: string;
  application_status: string;
  risk_status: string;
  reviewer_id?: string | null;
}

export interface ApiApplicationResponse {
  message?: string;
  data?: MerchantApplication;
}

export interface SaveRequest {
  isDraft: boolean;
  auto: boolean;
}

export interface SaveQueueResult {
  request: SaveRequest;
  application: MerchantApplication | null;
  error: unknown | null;
}

export type ApplicationApiResponse =
  | MerchantApplication
  | ApiApplicationResponse;
