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

export type FunctionParameterType =
  | 'number'
  | 'string'
  | 'boolean'
  | 'array'
  | 'object'
  | 'ListNode'
  | 'TreeNode'
  | 'Graph';

export type FunctionReturnType =
  | 'number'
  | 'string'
  | 'boolean'
  | 'array'
  | 'object'
  | 'ListNode'
  | 'TreeNode'
  | 'void';

export type FunctionConstructFrom = 'array' | 'object' | 'adjacencyList';

export type FunctionSignatureParameter = {
  name: string;
  type: FunctionParameterType;
  constructFrom?: FunctionConstructFrom;
};

export type FunctionSignature = {
  name: string;
  parameters: FunctionSignatureParameter[];
  returnType: FunctionReturnType;
};

export const PARAMETER_TYPE_OPTIONS: FunctionParameterType[] = [
  'number',
  'string',
  'boolean',
  'array',
  'object',
  'ListNode',
  'TreeNode',
  'Graph',
];

export const RETURN_TYPE_OPTIONS: FunctionReturnType[] = [
  'number',
  'string',
  'boolean',
  'array',
  'object',
  'ListNode',
  'TreeNode',
  'void',
];

export const CONSTRUCT_FROM_OPTIONS: FunctionConstructFrom[] = ['array', 'object', 'adjacencyList'];

const PARAM_TYPES_REQUIRING_CONSTRUCT_FROM = new Set<FunctionParameterType>([
  'ListNode',
  'TreeNode',
  'Graph',
]);

const normalizeFunctionSignature = (
  signature?: FunctionSignature,
): FunctionSignature | undefined => {
  if (!signature) return undefined;

  const nameValue = signature.name;
  const name = typeof nameValue === 'string' ? nameValue.trim() : '';
  const returnTypeValue = signature.returnType;
  const returnType = RETURN_TYPE_OPTIONS.includes(returnTypeValue) ? returnTypeValue : undefined;

  const rawParameters = Array.isArray(signature.parameters) ? signature.parameters : [];

  const parameters = rawParameters
    .map((parameter) => {
      if (!parameter) return null;

      const nameValue = (parameter as { name?: unknown }).name;
      const normalizedName = typeof nameValue === 'string' ? nameValue.trim() : '';

      const typeValue = (parameter as { type?: string }).type;
      const normalizedType = PARAMETER_TYPE_OPTIONS.includes(typeValue as FunctionParameterType)
        ? (typeValue as FunctionParameterType)
        : undefined;

      if (!normalizedName || !normalizedType) {
        return null;
      }

      let constructFrom: FunctionConstructFrom | undefined;
      if (PARAM_TYPES_REQUIRING_CONSTRUCT_FROM.has(normalizedType)) {
        const constructFromValue = (parameter as { constructFrom?: string }).constructFrom;
        constructFrom = CONSTRUCT_FROM_OPTIONS.includes(constructFromValue as FunctionConstructFrom)
          ? (constructFromValue as FunctionConstructFrom)
          : undefined;

        // Only reject if constructFrom is missing for complex types
        if (!constructFrom) {
          return null;
        }
      }

      const normalizedParameter: FunctionSignatureParameter = {
        name: normalizedName,
        type: normalizedType,
      };

      if (constructFrom) {
        normalizedParameter.constructFrom = constructFrom;
      }

      return normalizedParameter;
    })
    .filter((parameter): parameter is FunctionSignatureParameter => parameter !== null);

  // A function signature is valid if it has a name and return type
  // Parameters are optional
  if (!name || !returnType) {
    return undefined;
  }

  return {
    name,
    returnType,
    parameters,
  };
};

export type QuestionDto = {
  _id: string;
  title: string;
  description: string;
  difficulty: QuestionDifficulty;
  topics: string[];
  tags: string[];
  constraints?: string[];
  functionSignature?: FunctionSignature;
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
  functionSignature?: FunctionSignature;
};

const normalizeStringArray = (values?: string[]): string[] | undefined => {
  if (!values) return undefined;

  const normalized = values
    .map((value) => (typeof value === 'string' ? value.trim() : ''))
    .filter((value) => value.length > 0);

  return Array.from(new Set(normalized));
};

const parseJsonIfPossible = (value: string): unknown => {
  const trimmed = value.trim();
  if (!trimmed) return '';

  try {
    return JSON.parse(trimmed);
  } catch {
    return trimmed;
  }
};

const normalizeTestCases = (testCases: QuestionTestCase[]): QuestionTestCase[] =>
  testCases
    .map((testCase) => {
      const paramsValue = (testCase as { params?: unknown }).params;
      let params: unknown[] | null = null;

      if (Array.isArray(paramsValue)) {
        params = paramsValue;
      } else if (typeof paramsValue === 'string') {
        try {
          const parsed = JSON.parse(paramsValue);
          params = Array.isArray(parsed) ? parsed : null;
        } catch {
          params = null;
        }
      }

      if (!params) {
        return null;
      }

      const expectedValue = (testCase as { expected?: unknown }).expected;
      const expected =
        typeof expectedValue === 'string' ? parseJsonIfPossible(expectedValue) : expectedValue;

      if (expected === undefined) {
        return null;
      }

      const explanationValue = (testCase as { explanation?: unknown }).explanation;
      const explanation =
        typeof explanationValue === 'string' ? explanationValue.trim() : undefined;

      const normalized: QuestionTestCase = {
        params,
        expected,
        type: testCase.type === 'Hidden' ? 'Hidden' : 'Sample',
      };

      if (explanation && explanation.length > 0) {
        normalized.explanation = explanation;
      }

      return normalized;
    })
    .filter((testCase): testCase is QuestionTestCase => testCase !== null);

const prepareQuestionPayload = <T extends Partial<CreateQuestionPayload>>(payload: T): T => {
  const prepared = { ...payload } as T & Partial<CreateQuestionPayload>;

  if (typeof prepared.title === 'string') {
    prepared.title = prepared.title.trim();
  }

  if (typeof prepared.description === 'string') {
    prepared.description = prepared.description.trim();
  }

  if (Array.isArray(prepared.topics)) {
    prepared.topics = normalizeStringArray(prepared.topics) ?? [];
  }

  if (Array.isArray(prepared.tags)) {
    prepared.tags = normalizeStringArray(prepared.tags) ?? [];
  }

  if (Array.isArray(prepared.constraints)) {
    prepared.constraints = normalizeStringArray(prepared.constraints) ?? [];
  }

  if (Array.isArray(prepared.testCases)) {
    prepared.testCases = normalizeTestCases(prepared.testCases);
  }

  if ('functionSignature' in prepared) {
    const preparedWithSignature = prepared as {
      functionSignature?: FunctionSignature;
    };
    const normalizedSignature = normalizeFunctionSignature(preparedWithSignature.functionSignature);
    if (normalizedSignature) {
      preparedWithSignature.functionSignature = normalizedSignature;
    } else if (preparedWithSignature.functionSignature !== undefined) {
      delete preparedWithSignature.functionSignature;
    }
  }

  return prepared;
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
  const formattedPayload = prepareQuestionPayload(payload);
  const res = await questionApi.post('/api/questions', formattedPayload);
  return res.data;
}

export async function fetchQuestionById(id: string): Promise<QuestionDto> {
  const res = await questionApi.get<{ success: boolean; data: QuestionDto }>(
    `/api/questions/${id}`,
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
  functionSignature?: FunctionSignature;
};

export async function updateQuestion(id: string, payload: UpdateQuestionPayload) {
  const formattedPayload = prepareQuestionPayload(payload);
  const res = await questionApi.put(`/api/questions/${id}`, formattedPayload);
  return res.data;
}

export async function deleteQuestion(id: string) {
  const res = await questionApi.delete(`/api/questions/${id}`);
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
