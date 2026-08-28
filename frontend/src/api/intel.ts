import { apiClient } from './client';

export interface InterviewIntel {
  id: string;
  posting_id: string;
  company_id: string;
  verified_via_application_id: string;
  rounds: Array<{
    title: string;
    description: string;
  }>;
  overall_difficulty?: number;
  outcome?: string;
  is_anonymous: boolean;
  created_at: string;
  job_title: string;
  company_name: string;
}

export const submitIntel = async (intelData: {
  posting_id: string;
  rounds: Array<{ title: string; description: string }>;
  overall_difficulty?: number;
  outcome?: string;
  is_anonymous: boolean;
}): Promise<InterviewIntel> => {
  const response = await apiClient.post('/intel/', intelData);
  return response.data;
};

export const getIntelFeed = async (companyName?: string): Promise<InterviewIntel[]> => {
  const response = await apiClient.get('/intel/', {
    params: companyName ? { company_name: companyName } : undefined
  });
  return response.data;
};
