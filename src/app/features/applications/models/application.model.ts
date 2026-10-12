export type Role = 'ADMIN' | 'SALES' | 'REVIEWER';

export interface CurrentUser {
  id: string;
  email: string;
  role: Role;
}

export interface Application {
  id: string;
  business_name: string;
  legal_business_name: string;
  business_type: string;
  owner_name: string;
  owner_email: string;
  owner_phone: string;
  processing_volume: number | string;
  processing_currency: string;
  application_status: string;
  risk_status: string;
  created_by_id: string;
  created_by_name: string;
  assigned_reviewer_id: string | null;
  assigned_reviewer_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApplicationsResponse {
  data: Application[];
  total: number;
  page: number;
  limit: number;
}

export interface ApplicationFilters {
  page: number;
  limit: number;
  search?: string;
  application_status?: string;
  risk_status?: string;
}
