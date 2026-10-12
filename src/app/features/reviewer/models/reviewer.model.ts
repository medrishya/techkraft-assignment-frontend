export type UserRole = 'ADMIN' | 'REVIEWER' | 'SALES';

export type ReviewDecision = 'APPROVE' | 'REJECT' | 'REQUEST_INFO';

export type ConfirmAction = 'REASSIGN' | 'REVIEW';

export interface Application {
  id: string;
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
  created_by_id?: string;
  created_by_name?: string;
  reviewer_id?: string | null;
  assigned_reviewer_id?: string | null;
  assigned_reviewer_name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReviewerOption {
  id: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  role?: UserRole;
}

export interface Review {
  id: string;
  application_id: string;
  event_type?: string;
  decision?: ReviewDecision;
  previous_application_status?: string | null;
  application_status?: string;
  previous_risk_status?: string | null;
  risk_status?: string;
  actor_id?: string;
  actor_name?: string;
  comments?: string;
  created_at: string;
}

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface ApiResponse<T> {
  message?: string;
  data: T;
}

export interface ReviewSubmissionResponse {
  message: string;
  data: Application;
  review: Review;
}
