import axios from 'axios';

const baseURL =
  process.env.NEXT_PUBLIC_QUESTION_SERVICE_URL ||
  process.env.NEXT_PUBLIC_API_QUESTION_URL ||
  'http://34.8.234.19/api/questions';

const questionApi = axios.create({
  baseURL,
  // Question service does not require cookies by default
  withCredentials: true,
});

export type QuestionsListResponse<T> = {
  success: boolean;
  count?: number;
  data: T;
};

export async function fetchCategories(): Promise<string[]> {
  const res = await questionApi.get<QuestionsListResponse<string[]>>('/categories');
  return res.data?.data ?? [];
}

export async function fetchDifficulties(): Promise<string[]> {
  const res = await questionApi.get<QuestionsListResponse<string[]>>('/difficulties');
  return res.data?.data ?? [];
}
