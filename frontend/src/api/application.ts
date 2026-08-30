import { apiClient } from './client';

export interface Application {
  id: string;
  user_id: string;
  posting_id: string;
  status: string;
  status_history: Array<{
    status: string;
    at: string;
    actor: string;
    note?: string;
  }>;
  cover_note?: string;
  applied_at: string;
  last_employer_response_at?: string;
  is_ghosted: boolean;
  created_at: string;
  updated_at: string;
  
  job_title: string;
  company_name: string;
}

export const applyToJob = async (data: { posting_id: string; resume_url: string; cover_note?: string }): Promise<Application> => {
  const response = await apiClient.post('/applications/', data);
  return response.data;
};

export const createApplication = applyToJob;

export const getMyApplications = async (): Promise<Application[]> => {
  const response = await apiClient.get('/applications/me');
  return response.data;
};

export const getJobApplications = async (job_id: string): Promise<Application[]> => {
  const response = await apiClient.get(`/applications/job/${job_id}`);
  return response.data;
};

export const updateApplicationStatus = async (app_id: string, status: string, note?: string): Promise<Application> => {
  const response = await apiClient.patch(`/applications/${app_id}/status`, { status, note });
  return response.data;
};
