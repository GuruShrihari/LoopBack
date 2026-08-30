import { apiClient } from './client';

export interface ReferralOffer {
  id: string;
  referrer_id: string;
  posting_id: string;
  company_id: string;
  tags: string[];
  weekly_capacity: number;
  current_week_count: number;
  accepted_count: number;
  is_active: boolean;
  created_at: string;
}

export interface ReferralRequest {
  id: string;
  offer_id: string;
  requester_id: string;
  posting_id: string;
  resume_url?: string;
  match_score?: number;
  message?: string;
  status: string;
  created_at: string;
  resolved_at?: string;
}

export const getReferralOffers = async (companyId?: string, tag?: string): Promise<ReferralOffer[]> => {
  const params = new URLSearchParams();
  if (companyId) params.append('company_id', companyId);
  if (tag) params.append('tag', tag);
  const query = params.toString();
  const response = await apiClient.get(`/referral-offers${query ? `?${query}` : ''}`);
  return response.data;
};

export const createReferralOffer = async (data: { company_id: string; posting_id: string; tags: string[]; weekly_capacity?: number }): Promise<ReferralOffer> => {
  const response = await apiClient.post('/referral-offers', data);
  return response.data;
};

export const createReferralRequest = async (offerId: string, data: { posting_id: string; resume_url: string; message?: string }): Promise<ReferralRequest> => {
  const response = await apiClient.post(`/referral-offers/${offerId}/requests`, data);
  return response.data;
};

export const getIncomingRequests = async (): Promise<ReferralRequest[]> => {
  const response = await apiClient.get('/referral-requests/incoming');
  return response.data;
};

export const getMyRequests = async (): Promise<ReferralRequest[]> => {
  const response = await apiClient.get('/referral-requests/me');
  return response.data;
};

export const updateRequestStatus = async (requestId: string, status: string): Promise<ReferralRequest> => {
  const response = await apiClient.patch(`/referral-requests/${requestId}`, { status });
  return response.data;
};

export const updateReferralRequest = updateRequestStatus;
