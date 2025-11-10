'use client';

import type { Dispatch, KeyboardEvent, RefObject, SetStateAction } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import Header from '@/components/ui/Header';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  QuestionDto,
  fetchAllQuestions,
  fetchCategories,
  fetchDifficulties,
  fetchRecentQuestions,
  searchQuestionsApi,
} from '@/services/question.service';
import Link from 'next/link';

type DifficultyValue = QuestionDto['difficulty'];
type QuestionRow = QuestionDto & { rowNumber: number };

const PAGE_SIZE = 10;

function sortByUpdatedAtDesc(data: QuestionDto[]): QuestionDto[] {
  return [...data].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

function withRowNumbers(data: QuestionDto[]): QuestionRow[] {
  return data.map((item, index) => ({
    ...item,
    rowNumber: index + 1,
  }));
}

export default function AdminQuestionsPage() {
  const [searchText, setSearchText] = useState('');
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [availableDifficulties, setAvailableDifficulties] = useState<string[]>([]);
  const [availableTopics, setAvailableTopics] = useState<string[]>([]);

  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isTagPopoverOpen, setIsTagPopoverOpen] = useState(false);

  const tagInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let ignore = false;

    const loadInitialData = async () => {
      try {
        setLoading(true);
        const [recent, difficulties, topics] = await Promise.all([
          fetchRecentQuestions(),
          fetchDifficulties(),
          fetchCategories(),
        ]);

        if (!ignore) {
          setQuestions(withRowNumbers(sortByUpdatedAtDesc(recent)));
          setAvailableDifficulties(difficulties);
          setAvailableTopics(topics);
          setCurrentPage(1);
        }
      } catch (err) {
        if (!ignore) {
          console.error('Failed to load initial question data', err);
          setError('Unable to load questions. Please try again later.');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadInitialData();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (isTagPopoverOpen) {
      requestAnimationFrame(() => {
        tagInputRef.current?.focus();
      });
    }
  }, [isTagPopoverOpen]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(questions.length / PAGE_SIZE)),
    [questions.length],
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const currentPageQuestions = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return questions.slice(start, start + PAGE_SIZE);
  }, [currentPage, questions]);

  const handleSearch = async () => {
    try {
      setLoading(true);
      setError(null);

      const trimmedQuery = searchText.trim();
      const hasQuery = trimmedQuery.length > 0;
      const hasFilters =
        selectedDifficulties.length > 0 || selectedTopics.length > 0 || selectedTags.length > 0;

      let result: QuestionDto[];

      if (!hasQuery && !hasFilters) {
        result = await fetchAllQuestions();
      } else {
        result = await searchQuestionsApi({
          query: trimmedQuery,
          difficulties: selectedDifficulties,
          topics: selectedTopics,
          tags: selectedTags,
        });
      }

      const sortedResult = sortByUpdatedAtDesc(result);
      setQuestions(withRowNumbers(sortedResult));
      setCurrentPage(1);
    } catch (err) {
      console.error('Search failed', err);
      setError('Unable to fetch questions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (
    value: string,
    checked: boolean,
    setter: Dispatch<SetStateAction<string[]>>,
  ) => {
    setter((prev) => {
      if (checked) {
        if (prev.includes(value)) {
          return prev;
        }
        return [...prev, value];
      }
      return prev.filter((item) => item !== value);
    });
  };

  const handleTagKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return;

    event.preventDefault();
    const nextTags = tagInput
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    if (nextTags.length === 0) {
      return;
    }

    setSelectedTags((prev) => {
      const merged = new Set([...prev, ...nextTags]);
      return Array.from(merged);
    });
    setTagInput('');
    setIsTagPopoverOpen(true);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setSelectedTags((prev) => prev.filter((tag) => tag !== tagToRemove));
  };

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      void handleSearch();
    }
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-10">
      <Header className="text-center">Question Bank</Header>

      <div className="mb-4 flex justify-center">
        <input
          type="text"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          onKeyDown={handleSearchKeyDown}
          placeholder="Search questions by title or description"
          className="w-full md:w-[720px] rounded-md border bg-background px-4 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="mb-6 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <FilterDropdown
            label="Difficulty"
            options={availableDifficulties}
            selected={selectedDifficulties}
            onToggle={(value, checked) => toggleSelection(value, checked, setSelectedDifficulties)}
          />
          <FilterDropdown
            label="Topics"
            options={availableTopics}
            selected={selectedTopics}
            onToggle={(value, checked) => toggleSelection(value, checked, setSelectedTopics)}
          />
          <TagPopover
            open={isTagPopoverOpen}
            onOpenChange={setIsTagPopoverOpen}
            tagInput={tagInput}
            onTagInputChange={setTagInput}
            onTagKeyDown={handleTagKeyDown}
            selectedTags={selectedTags}
            onRemoveTag={handleRemoveTag}
            inputRef={tagInputRef}
          />
          <Button variant="secondary" onClick={() => void handleSearch()} disabled={loading}>
            Apply Filters
          </Button>
        </div>
        {error && <p className="text-center text-sm text-destructive">{error}</p>}
      </div>

      <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="[&_th]:py-3 [&_th]:px-4 bg-muted/60 text-muted-foreground">
            <tr className="border-b">
              <th className="text-left w-[80px]">ID No.</th>
              <th className="text-left min-w-[260px]">Question Title</th>
              <th className="text-left w-[110px]">Difficulty</th>
              <th className="text-left min-w-[180px]">Topics</th>
              <th className="text-left min-w-[200px]">Tags</th>
              <th className="text-right w-[96px]" />
            </tr>
          </thead>
          <tbody className="[&_td]:py-4 [&_td]:px-4">
            {loading && questions.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                  Loading questions...
                </td>
              </tr>
            ) : currentPageQuestions.length > 0 ? (
              currentPageQuestions.map((question) => (
                <tr key={question._id} className="border-b last:border-0 hover:bg-muted/40">
                  <td className="align-top text-muted-foreground">{question.rowNumber}</td>
                  <td className="align-top">
                    <span className="font-medium">{question.title}</span>
                  </td>
                  <td className="align-top">
                    <Difficulty value={question.difficulty} />
                  </td>
                  <td className="align-top">
                    <Chips values={question.topics} />
                  </td>
                  <td className="align-top">
                    <Chips values={question.tags} />
                  </td>
                  <td className="align-top text-right">
                    <Button size="sm" asChild>
                      <Link href={`/admin/questions/edit?id=${question._id}`}>Edit</Link>
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                  No questions found. Adjust your search or filters and try again.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-center gap-4">
        <Button
          variant="outline"
          onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
          disabled={currentPage === 1}
        >
          Previous
        </Button>
        <span className="text-sm text-muted-foreground">
          Page {Math.min(currentPage, totalPages)} of {totalPages}
        </span>
        <Button
          variant="outline"
          onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
          disabled={currentPage >= totalPages}
        >
          Next
        </Button>
      </div>

      <div className="mt-6 flex justify-center">
        <Button className="min-w-[180px]" asChild>
          <Link href="/admin/questions/add">Add Question</Link>
        </Button>
      </div>
    </div>
  );
}

function FilterDropdown({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (value: string, checked: boolean) => void;
}) {
  const selectionCount = selected.length;
  const buttonLabel = selectionCount > 0 ? `${label} (${selectionCount})` : label;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="min-w-[180px] justify-between">
          <span>{buttonLabel}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {options.length === 0 ? (
          <div className="px-2 py-1.5 text-sm text-muted-foreground">No options available</div>
        ) : (
          options.map((option) => (
            <DropdownMenuCheckboxItem
              key={option}
              checked={selected.includes(option)}
              onCheckedChange={(checked) => onToggle(option, checked === true)}
            >
              {option}
            </DropdownMenuCheckboxItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Difficulty({ value }: { value: DifficultyValue }) {
  const color =
    value === 'Easy'
      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
      : value === 'Medium'
        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
        : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300';

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${color}`}
    >
      {value}
    </span>
  );
}

function Chips({ values }: { values: string[] }) {
  if (!values?.length) return <span className="text-muted-foreground">—</span>;
  return (
    <div className="flex flex-wrap gap-2">
      {values.map((value) => (
        <span
          key={value}
          className="inline-flex items-center rounded-md border px-2 py-1 text-xs text-muted-foreground"
        >
          {value}
        </span>
      ))}
    </div>
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
        className="ml-1 rounded-full p-0.5 text-muted-foreground transition hover:bg-muted/80 hover:text-foreground"
        aria-label={`Remove tag ${label}`}
      >
        {'x'}
      </button>
    </span>
  );
}

function TagPopover({
  open,
  onOpenChange,
  tagInput,
  onTagInputChange,
  onTagKeyDown,
  selectedTags,
  onRemoveTag,
  inputRef,
}: {
  open: boolean;
  onOpenChange: (state: boolean) => void;
  tagInput: string;
  onTagInputChange: (value: string) => void;
  onTagKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  selectedTags: string[];
  onRemoveTag: (tag: string) => void;
  inputRef: RefObject<HTMLInputElement | null>;
}) {
  const tagCount = selectedTags.length;
  const buttonLabel = tagCount > 0 ? `Tags (${tagCount})` : 'Tags';

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="min-w-[180px] justify-between">
          <span>{buttonLabel}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="tag-input">
              Add tags (press Enter to add multiple)
            </label>
            <input
              id="tag-input"
              ref={inputRef}
              type="text"
              value={tagInput}
              onChange={(event) => onTagInputChange(event.target.value)}
              onKeyDown={onTagKeyDown}
              placeholder="tag-one, tag-two"
              className="rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedTags.length > 0 ? (
              selectedTags.map((tag) => (
                <TagChip key={tag} label={tag} onRemove={() => onRemoveTag(tag)} />
              ))
            ) : (
              <span className="text-xs text-muted-foreground">No tags added yet.</span>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
