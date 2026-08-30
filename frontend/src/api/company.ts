import { apiClient } from './client';

export interface Company {
  id: string;
  name: string;
  slug: string;
  website?: string;
  verification_doc_url?: string;
  employee_proof_doc_url?: string;
  is_verified: boolean;
  created_by_user_id?: string;
  median_response_hours?: number;
  ghosting_rate?: number;
  interview_to_offer_rate?: number;
  total_tracked_applications: number;
  created_at: string;
}

export const getCompanies = async (): Promise<Company[]> => {
  const response = await apiClient.get('/companies/');
  return response.data;
};

export const createCompany = async (data: { name: string; website?: string; verification_doc_url?: string; employee_proof_doc_url?: string }): Promise<Company> => {
  const response = await apiClient.post('/companies/', data);
  return response.data;
};
