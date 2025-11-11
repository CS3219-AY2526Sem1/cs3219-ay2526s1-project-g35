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
  params: unknown[];
  expected: unknown;
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
    await questionApi.get<QuestionsListResponse<QuestionDto[]>>('/questions/recent10');
  return res.data?.data ?? [];
}

export async function fetchAllQuestions(): Promise<QuestionDto[]> {
  const res = await questionApi.get<QuestionsListResponse<QuestionDto[]>>('/questions');
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

  const res = await questionApi.get<QuestionsListResponse<QuestionDto[]>>('/questions/search', {
    params: searchParams,
  });

  return res.data?.data ?? [];
}

export async function fetchCategories(): Promise<string[]> {
  const res = await questionApi.get<QuestionsListResponse<string[]>>('/questions/categories');
  return res.data?.data ?? [];
}

export async function fetchDifficulties(): Promise<string[]> {
  const res = await questionApi.get<QuestionsListResponse<string[]>>('/questions/difficulties');
  return res.data?.data ?? [];
}

export async function createQuestion(payload: CreateQuestionPayload) {
  const res = await questionApi.post('/questions', payload);
  return res.data;
}

export async function fetchQuestionById(id: string): Promise<QuestionDto> {
  const res = await questionApi.get<{ success: boolean; data: QuestionDto }>(
    `/questions/${id}`,
  );
  return res.data?.data;
}

export type UpdateQuestionPayload = Partial<CreateQuestionPayload> & {
  title?: string;
  description?: string;
  difficulty?: QuestionDifficulty;
  topics?: string[];
  tags?: string[];
  testCases?: QuestionTestCase[];
  constraints?: string[];
};

export async function updateQuestion(id: string, payload: UpdateQuestionPayload) {
  const res = await questionApi.put(`/questions/${id}`, payload);
  return res.data;
}

export async function deleteQuestion(id: string) {
  const res = await questionApi.delete(`/questions/${id}`);
  return res.data;
}

/**
 * Helper function to format test case params for display
 * Converts the params array to a readable string
 */
export function formatTestCaseInput(testCase: QuestionTestCase): string {
  if (!testCase.params || testCase.params.length === 0) {
    return '';
  }

  return JSON.stringify(testCase.params);
}

/**
 * Helper function to format test case expected output for display
 * Converts the expected value to a readable string
 */
export function formatTestCaseOutput(testCase: QuestionTestCase): string {
  if (testCase.expected === undefined) {
    return '';
  }

  return JSON.stringify(testCase.expected);
}
