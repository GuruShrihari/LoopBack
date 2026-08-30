import { apiClient } from './client';

export interface AIMatchResponse {
  match_score: number;
  match_summary: string;
  strengths: string[];
  gaps: string[];
  referral_pitch: string;
}

export const analyzeJobMatch = async (postingId: string, resumeFile: File): Promise<AIMatchResponse> => {
  const formData = new FormData();
  formData.append('posting_id', postingId);
  formData.append('file', resumeFile);

  const response = await apiClient.post('/ai/match', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};
