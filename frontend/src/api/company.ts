import { apiClient } from './client';

export interface Company {
  id: string;
  name: string;
  slug: string;
  website?: string;
  is_verified: boolean;
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

export const createCompany = async (name: string, website?: string): Promise<Company> => {
  const response = await apiClient.post('/companies/', { name, website });
  return response.data;
};
