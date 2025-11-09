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

export type QuestionDifficulty = 'Easy' | 'Medium' | 'Hard';

export type QuestionTestCase = {
  input: string;
  expectedOutput: string;
  explanation?: string;
  type: 'Sample' | 'Hidden';
};

export type QuestionDto = {
  _id: string;
  title: string;
  description: string;
  difficulty: QuestionDifficulty;
  topics: string[];
  tags: string[];
  constraints?: string[];
  testCases?: QuestionTestCase[];
  createdAt: string;
  updatedAt: string;
};

export type CreateQuestionPayload = {
  title: string;
  description: string;
  difficulty: QuestionDifficulty;
  topics: string[];
  tags: string[];
  testCases: QuestionTestCase[];
  constraints?: string[];
};

export async function fetchRecentQuestions(): Promise<QuestionDto[]> {
  const res =
    await questionApi.get<QuestionsListResponse<QuestionDto[]>>('/api/questions/recent10');
  return res.data?.data ?? [];
}

export async function fetchAllQuestions(): Promise<QuestionDto[]> {
  const res = await questionApi.get<QuestionsListResponse<QuestionDto[]>>('/api/questions');
  return res.data?.data ?? [];
}

export async function searchQuestionsApi(params: {
  query?: string;
  difficulties?: string[];
  topics?: string[];
  tags?: string[];
}): Promise<QuestionDto[]> {
  const { query, difficulties, topics, tags } = params;
  const searchParams: Record<string, string> = {};

  if (query && query.trim().length > 0) {
    searchParams.q = query.trim();
  }

  if (difficulties && difficulties.length > 0) {
    searchParams.difficulty = difficulties.join(',');
  }

  if (topics && topics.length > 0) {
    searchParams.topics = topics.join(',');
  }

  if (tags && tags.length > 0) {
    searchParams.tags = tags.join(',');
  }

  const res = await questionApi.get<QuestionsListResponse<QuestionDto[]>>('/api/questions/search', {
    params: searchParams,
  });

  return res.data?.data ?? [];
}

export async function fetchCategories(): Promise<string[]> {
  const res = await questionApi.get<QuestionsListResponse<string[]>>('/api/questions/categories');
  return res.data?.data ?? [];
}

export async function fetchDifficulties(): Promise<string[]> {
  const res = await questionApi.get<QuestionsListResponse<string[]>>('/api/questions/difficulties');
  return res.data?.data ?? [];
}

export async function createQuestion(payload: CreateQuestionPayload) {
  const res = await questionApi.post('/api/questions', payload);
  return res.data;
}
