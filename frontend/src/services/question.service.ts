import axios from 'axios';

const baseURL = process.env.NEXT_PUBLIC_QUESTION_SERVICE_URL || 'http://localhost:8001';

const questionApi = axios.create({
  baseURL,
  // Enable credentials to send JWT cookies with requests
  withCredentials: true,
});

export type QuestionsListResponse<T> = {
  success: boolean;
  count?: number;
  data: T;
};

export async function fetchCategories(): Promise<string[]> {
  const res = await questionApi.get<QuestionsListResponse<string[]>>('/api/questions/categories');
  return res.data?.data ?? [];
}

export async function fetchDifficulties(): Promise<string[]> {
  const res = await questionApi.get<QuestionsListResponse<string[]>>('/api/questions/difficulties');
  return res.data?.data ?? [];
}
