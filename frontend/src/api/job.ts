import { apiClient } from './client';

export interface JobPosting {
  id: string;
  company_id: string;
  title: string;
  description: string;
  requirements?: string;
  location?: string;
  is_remote: boolean;
  salary_min?: number;
  salary_max?: number;
  tags: string[];
  status: string;
  scam_risk_score?: number;
  created_at: string;
}

export const getJobs = async (): Promise<JobPosting[]> => {
  const response = await apiClient.get('/jobs/');
  return response.data;
};

export const getMyJobs = async (): Promise<JobPosting[]> => {
  const response = await apiClient.get('/jobs/me');
  return response.data;
};

export const createJob = async (jobData: Partial<JobPosting>): Promise<JobPosting> => {
  const response = await apiClient.post('/jobs/', jobData);
  return response.data;
};
