'use client';

import { isAxiosError } from 'axios';
import { X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { FormEvent, KeyboardEvent, RefObject } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import Header from '@/components/ui/Header';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  CreateQuestionPayload,
  QuestionDifficulty,
  QuestionTestCase,
  createQuestion,
  fetchCategories,
  fetchDifficulties,
} from '@/services/question.service';

type EditableTestCase = {
  id: string;
  input: string;
  expectedOutput: string;
  explanation: string;
  type: QuestionTestCase['type'];
};

const TEST_CASE_TYPES: QuestionTestCase['type'][] = ['Sample', 'Hidden'];

const DEFAULT_DIFFICULTIES: QuestionDifficulty[] = ['Easy', 'Medium', 'Hard'];

const createTestCase = (): EditableTestCase => ({
  id:
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`,
  input: '',
  expectedOutput: '',
  explanation: '',
  type: 'Sample',
});

export default function AddQuestionPage() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<QuestionDifficulty | ''>('');

  const [availableDifficulties, setAvailableDifficulties] = useState<QuestionDifficulty[]>([]);
  const [availableTopics, setAvailableTopics] = useState<string[]>([]);

  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [topicInput, setTopicInput] = useState('');
  const [topicsPopoverOpen, setTopicsPopoverOpen] = useState(false);
  const topicsInputRef = useRef<HTMLInputElement | null>(null);

  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [tagsPopoverOpen, setTagsPopoverOpen] = useState(false);
  const tagsInputRef = useRef<HTMLInputElement | null>(null);

  const [testCases, setTestCases] = useState<EditableTestCase[]>([createTestCase()]);

  const [loadingOptions, setLoadingOptions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    const loadOptions = async () => {
      try {
        setLoadingOptions(true);
        const [difficulties, topics] = await Promise.all([
          fetchDifficulties().catch(() => DEFAULT_DIFFICULTIES),
          fetchCategories().catch(() => []),
        ]);

        if (!ignore) {
          const nextDifficulties =
            difficulties.length > 0 ? (difficulties as QuestionDifficulty[]) : DEFAULT_DIFFICULTIES;

          setAvailableDifficulties(nextDifficulties);
          setAvailableTopics(topics);

          if (!selectedDifficulty && nextDifficulties.length > 0) {
            setSelectedDifficulty(nextDifficulties[0]);
          }
        }
      } finally {
        if (!ignore) {
          setLoadingOptions(false);
        }
      }
    };

    void loadOptions();

    return () => {
      ignore = true;
    };
    // We intentionally run this effect only once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (topicsPopoverOpen) {
      requestAnimationFrame(() => {
        topicsInputRef.current?.focus();
      });
    }
  }, [topicsPopoverOpen]);

  useEffect(() => {
    if (tagsPopoverOpen) {
      requestAnimationFrame(() => {
        tagsInputRef.current?.focus();
      });
    }
  }, [tagsPopoverOpen]);

  const difficultyOptions = useMemo(
    () => (availableDifficulties.length ? availableDifficulties : DEFAULT_DIFFICULTIES),
    [availableDifficulties],
  );

  const addValues = (current: string[], values: string[]) => {
    const normalized = values.map((value) => value.trim()).filter((value) => value.length > 0);
    const merged = new Set([...current, ...normalized]);
    return Array.from(merged);
  };

  const handleTopicKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    setSelectedTopics((prev) => addValues(prev, topicInput.split(',')));
    setTopicInput('');
  };

  const handleTagKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    setSelectedTags((prev) => addValues(prev, tagInput.split(',')));
    setTagInput('');
  };

  const handleTestCaseChange = <K extends keyof EditableTestCase>(
    id: string,
    field: K,
    value: EditableTestCase[K],
  ) => {
    setTestCases((prev) =>
      prev.map((testCase) => (testCase.id === id ? { ...testCase, [field]: value } : testCase)),
    );
  };

  const handleRemoveTestCase = (id: string) => {
    setTestCases((prev) =>
      prev.length <= 1 ? prev : prev.filter((testCase) => testCase.id !== id),
    );
  };

  const handleAddTestCase = () => {
    setTestCases((prev) => [...prev, createTestCase()]);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();
    const difficulty = selectedDifficulty as QuestionDifficulty | '';

    if (!trimmedTitle || !trimmedDescription || !difficulty) {
      setFormError('Title, description, and difficulty are required.');
      return;
    }

    if (trimmedTitle.length < 5) {
      setFormError('Title must be at least 5 characters long.');
      return;
    }

    if (trimmedDescription.length < 10) {
      setFormError('Description must be at least 10 characters long.');
      return;
    }

    const sanitizedTopics = Array.from(
      new Set(selectedTopics.map((topic) => topic.trim()).filter((topic) => topic.length > 0)),
    );

    if (sanitizedTopics.length === 0) {
      setFormError('Please add at least one topic.');
      return;
    }

    const sanitizedTags = Array.from(
      new Set(selectedTags.map((tag) => tag.trim()).filter((tag) => tag.length > 0)),
    );

    // Transform test cases from UI format to API format
    const preparedTestCases = testCases.map(
      ({ input, expectedOutput, type, explanation }, index) => {
        const trimmedInput = input?.trim() ?? '';
        const trimmedExpectedOutput = expectedOutput?.trim() ?? '';

        // Parse input parameters as JSON array
        let parsedParams;
        try {
          parsedParams = JSON.parse(trimmedInput);
          if (!Array.isArray(parsedParams)) {
            throw new Error(`Test case ${index + 1}: Input parameters must be a JSON array`);
          }
        } catch (error) {
          throw new Error(
            `Test case ${index + 1}: Invalid input format. ${error instanceof Error ? error.message : 'Must be a valid JSON array.'}`,
          );
        }

        // Parse expected output as JSON
        let parsedExpected;
        try {
          parsedExpected = JSON.parse(trimmedExpectedOutput);
        } catch {
          throw new Error(
            `Test case ${index + 1}: Invalid expected output format. Must be valid JSON.`,
          );
        }

        return {
          params: parsedParams,
          expected: parsedExpected,
          type,
          explanation: explanation?.trim() ?? '',
        };
      },
    );

    let transformedTestCases;
    try {
      transformedTestCases = preparedTestCases;
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Invalid test case format');
      return;
    }

    const hasInvalidTestCase = transformedTestCases.some(
      (testCase) =>
        !testCase.params || testCase.params.length === 0 || testCase.expected === undefined,
    );

    if (hasInvalidTestCase) {
      setFormError('Each test case requires valid input parameters and expected output.');
      return;
    }

    const payload: CreateQuestionPayload = {
      title: trimmedTitle,
      description: trimmedDescription,
      difficulty,
      topics: sanitizedTopics,
      tags: sanitizedTags,
      testCases: transformedTestCases,
    };

    try {
      setSubmitting(true);
      setFormError(null);
      await createQuestion(payload);
      router.push('/admin/questions');
    } catch (error) {
      console.error('Failed to create question', error);
      let message = 'Failed to create question. Please try again.';
      if (isAxiosError(error)) {
        const responseMessage = error.response?.data?.error;
        if (typeof responseMessage === 'string' && responseMessage.trim().length > 0) {
          message = responseMessage;
        }
      }
      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-10">
      <Header className="text-center">Add Question</Header>

      <form onSubmit={handleSubmit} className="mt-8 space-y-8">
        <section className="space-y-6 rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold tracking-tight">Question Details</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">
                Title <span className="text-destructive">*</span>
              </label>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter question title"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">
                Description <span className="text-destructive">*</span>
              </label>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="min-h-32 w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Describe the problem, requirements, and constraints"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Difficulty <span className="text-destructive">*</span>
              </label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    {selectedDifficulty || 'Select difficulty'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="min-w-0 w-[var(--radix-dropdown-menu-trigger-width)]"
                >
                  <DropdownMenuRadioGroup
                    value={selectedDifficulty}
                    onValueChange={(value) => setSelectedDifficulty(value as QuestionDifficulty)}
                  >
                    {difficultyOptions.map((option) => (
                      <DropdownMenuRadioItem key={option} value={option}>
                        {option}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Topics <span className="text-destructive">*</span>
              </label>
              <MultiValuePopover
                buttonLabel="Topics"
                open={topicsPopoverOpen}
                onOpenChange={setTopicsPopoverOpen}
                inputRef={topicsInputRef}
                inputValue={topicInput}
                onInputChange={setTopicInput}
                onInputKeyDown={handleTopicKeyDown}
                values={selectedTopics}
                onRemoveValue={(value) =>
                  setSelectedTopics((prev) => prev.filter((topic) => topic !== value))
                }
                onAddValues={(next) => setSelectedTopics((prev) => addValues(prev, next))}
                suggestions={availableTopics}
                onSelectSuggestion={(suggestion) =>
                  setSelectedTopics((prev) => addValues(prev, [suggestion]))
                }
                placeholder="arrays, hashmap"
                helperText="Press Enter to add comma-separated topics."
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Tags</label>
              <MultiValuePopover
                buttonLabel="Tags"
                open={tagsPopoverOpen}
                onOpenChange={setTagsPopoverOpen}
                inputRef={tagsInputRef}
                inputValue={tagInput}
                onInputChange={setTagInput}
                onInputKeyDown={handleTagKeyDown}
                values={selectedTags}
                onRemoveValue={(value) =>
                  setSelectedTags((prev) => prev.filter((tag) => tag !== value))
                }
                onAddValues={(next) => setSelectedTags((prev) => addValues(prev, next))}
                suggestions={[]}
                onSelectSuggestion={(suggestion) =>
                  setSelectedTags((prev) => addValues(prev, [suggestion]))
                }
                placeholder="beginner-friendly, interview"
                helperText="Press Enter to add comma-separated tags."
              />
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight">Test Cases</h2>
            <Button type="button" variant="secondary" onClick={handleAddTestCase}>
              + Add New
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Provide at least one sample test case outlining the input, expected output, and optional
            explanation.
          </p>
          <div className="space-y-4">
            {testCases.map((testCase, index) => (
              <Card key={testCase.id} className="border-muted">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <CardTitle className="text-base font-semibold">Test Case {index + 1}</CardTitle>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveTestCase(testCase.id)}
                    disabled={testCases.length <= 1}
                    aria-label={`Remove test case ${index + 1}`}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Input Parameters <span className="text-destructive">*</span>
                      </label>
                      <textarea
                        value={testCase.input}
                        onChange={(event) =>
                          handleTestCaseChange(testCase.id, 'input', event.target.value)
                        }
                        className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm font-mono shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="[[2,7,11,15], 9]"
                      />
                      <p className="text-xs text-muted-foreground">
                        JSON array of parameters. Example: [[1,2,3], &quot;test&quot;, true]
                      </p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Expected Output <span className="text-destructive">*</span>
                      </label>
                      <textarea
                        value={testCase.expectedOutput}
                        onChange={(event) =>
                          handleTestCaseChange(testCase.id, 'expectedOutput', event.target.value)
                        }
                        className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm font-mono shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="[0,1]"
                      />
                      <p className="text-xs text-muted-foreground">
                        JSON value. Example: [0,1] or &quot;result&quot; or 42
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Explanation</label>
                      <textarea
                        value={testCase.explanation ?? ''}
                        onChange={(event) =>
                          handleTestCaseChange(testCase.id, 'explanation', event.target.value)
                        }
                        className="min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Explain why the expected output is correct"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Type</label>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="w-full justify-between">
                            {testCase.type}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="start"
                          className="min-w-0 w-[var(--radix-dropdown-menu-trigger-width)]"
                        >
                          <DropdownMenuRadioGroup
                            value={testCase.type}
                            onValueChange={(value) =>
                              handleTestCaseChange(
                                testCase.id,
                                'type',
                                value as QuestionTestCase['type'],
                              )
                            }
                          >
                            {TEST_CASE_TYPES.map((option) => (
                              <DropdownMenuRadioItem key={option} value={option}>
                                {option}
                              </DropdownMenuRadioItem>
                            ))}
                          </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {formError && <p className="text-center text-sm text-destructive">{formError}</p>}

        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/questions">Cancel</Link>
          </Button>
          <Button type="submit" disabled={submitting || loadingOptions}>
            {submitting ? 'Saving...' : 'Add Question'}
          </Button>
        </div>
      </form>
    </div>
  );
}

type MultiValuePopoverProps = {
  buttonLabel: string;
  open: boolean;
  onOpenChange: (state: boolean) => void;
  inputRef: RefObject<HTMLInputElement | null>;
  inputValue: string;
  onInputChange: (value: string) => void;
  onInputKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  values: string[];
  onRemoveValue: (value: string) => void;
  onAddValues: (values: string[]) => void;
  suggestions: string[];
  onSelectSuggestion: (value: string) => void;
  placeholder: string;
  helperText?: string;
};

function MultiValuePopover({
  buttonLabel,
  open,
  onOpenChange,
  inputRef,
  inputValue,
  onInputChange,
  onInputKeyDown,
  values,
  onRemoveValue,
  onAddValues,
  suggestions,
  onSelectSuggestion,
  placeholder,
  helperText,
}: MultiValuePopoverProps) {
  const count = values.length;
  const triggerLabel = count > 0 ? `${buttonLabel} (${count})` : buttonLabel;
  const inputId = `${buttonLabel.toLowerCase().replace(/\s+/g, '-')}-input`;

  const handleBlur = () => {
    if (!inputValue.trim()) return;
    onAddValues(inputValue.split(','));
    onInputChange('');
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          {triggerLabel}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="min-w-0 w-[var(--radix-popover-trigger-width)] space-y-2"
      >
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground" htmlFor={inputId}>
            {helperText ?? 'Press Enter to add values'}
          </label>
          <input
            id={inputId}
            ref={inputRef}
            value={inputValue}
            onChange={(event) => onInputChange(event.target.value)}
            onKeyDown={onInputKeyDown}
            onBlur={handleBlur}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder={placeholder}
          />
        </div>
        {suggestions.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Suggestions</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <Button
                  key={suggestion}
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => onSelectSuggestion(suggestion)}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        )}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            {values.length > 0 ? 'Selected' : 'No values added yet.'}
          </p>
          <div className="flex flex-wrap gap-2">
            {values.length > 0 ? (
              values.map((value) => (
                <TagChip key={value} label={value} onRemove={() => onRemoveValue(value)} />
              ))
            ) : (
              <span className="text-xs text-muted-foreground">Add items to see them here.</span>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function TagChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs text-muted-foreground">
      {label}
      <button
        type="button"
        onMouseDown={(event) => event.preventDefault()}
        onClick={onRemove}
        className="ml-1 rounded-full p-0.5 transition hover:bg-muted/80 hover:text-foreground"
        aria-label={`Remove ${label}`}
      >
        {'x'}
      </button>
    </span>
  );
}
