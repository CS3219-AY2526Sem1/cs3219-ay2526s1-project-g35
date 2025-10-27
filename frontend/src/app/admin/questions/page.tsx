'use client';

import Header from '@/components/ui/Header';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

type Row = {
  id: number;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  topics: string[];
  tags: string[];
};

const rows: Row[] = [
  {
    id: 1,
    title: 'Two Sum',
    difficulty: 'Easy',
    topics: ['HashMap'],
    tags: ['Beginner-friendly', 'Completed'],
  },
  {
    id: 2,
    title: 'Longest Substring Without Repeating Characters',
    difficulty: 'Medium',
    topics: ['Sliding Window', 'Two Pointers'],
    tags: ['Interview Question', 'Popular'],
  },
  {
    id: 3,
    title: 'Merge Two Sorted Lists',
    difficulty: 'Easy',
    topics: ['Two Pointers', 'Sorting'],
    tags: ['Beginner-friendly'],
  },
  {
    id: 4,
    title: 'Remove Duplicates From Sorted Array',
    difficulty: 'Easy',
    topics: ['Two Pointers'],
    tags: ['Beginner-friendly', 'Completed'],
  },
  {
    id: 5,
    title: 'Median of Two Sorted Arrays',
    difficulty: 'Hard',
    topics: ['Two Pointers'],
    tags: [],
  },
  { id: 6, title: 'N-Queens', difficulty: 'Hard', topics: ['SSSP'], tags: ['Completed'] },
];

export default function AdminQuestionsPage() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-10">
      <Header className="text-center">Question Bank</Header>

      <div className="mb-6 flex justify-center">
        <input
          type="text"
          placeholder="Enter your search criteria here"
          className="w-full md:w-[720px] rounded-md border bg-background px-4 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
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
              <th className="text-right w-[96px]"></th>
            </tr>
          </thead>
          <tbody className="[&_td]:py-4 [&_td]:px-4">
            {rows.map((r) => (
              <tr key={r.id} className="border-b last:border-0 hover:bg-muted/40">
                <td className="align-top text-muted-foreground">{r.id}</td>
                <td className="align-top">
                  <a href="#" className="font-medium hover:underline">
                    {r.title}
                  </a>
                </td>
                <td className="align-top">
                  <Difficulty value={r.difficulty} />
                </td>
                <td className="align-top">
                  <Chips values={r.topics} />
                </td>
                <td className="align-top">
                  <Chips values={r.tags} />
                </td>
                <td className="align-top text-right">
                  <Button size="sm" asChild>
                    <Link href={`/admin/questions/edit?id=${r.id}`}>Edit</Link>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex justify-center">
        <Button className="min-w-[180px]" asChild>
          <Link href="/admin/questions/add">Add Question</Link>
        </Button>
      </div>
    </div>
  );
}

function Difficulty({ value }: { value: Row['difficulty'] }) {
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
      {values.map((v, i) => (
        <span
          key={`${v}-${i}`}
          className="inline-flex items-center rounded-md border px-2 py-1 text-xs text-muted-foreground"
        >
          {v}
        </span>
      ))}
    </div>
  );
}
