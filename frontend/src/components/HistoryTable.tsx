'use client';

export type HistoryItem = {
  id: number;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  topics: string[];
  tags: string[];
};

type Props = {
  items: HistoryItem[];
  className?: string;
};

/**
 * Simple, accessible table styled with Tailwind.
 * Designed to match the look-and-feel in the History mock.
 */
export default function HistoryTable({ items, className }: Props) {
  return (
    <div className={`w-full overflow-x-auto ${className ?? ''}`}>
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
        <table className="w-full caption-bottom text-sm">
          <thead className="[&_th]:py-3 [&_th]:px-4">
            <tr className="border-b bg-muted/60 text-muted-foreground">
              <th className="text-left w-[90px]">ID No.</th>
              <th className="text-left min-w-[220px]">Question Title</th>
              <th className="text-left w-[110px]">Difficulty</th>
              <th className="text-left min-w-[180px]">Topics</th>
              <th className="text-left min-w-[200px]">Tags</th>
            </tr>
          </thead>
          <tbody className="[&_td]:py-4 [&_td]:px-4">
            {items.map((row) => (
              <tr key={row.id} className="border-b last:border-0 hover:bg-muted/40">
                <td className="align-top text-muted-foreground">{row.id}</td>
                <td className="align-top font-medium">{row.title}</td>
                <td className="align-top">
                  <DifficultyPill value={row.difficulty} />
                </td>
                <td className="align-top">
                  <ChipList values={row.topics} />
                </td>
                <td className="align-top">
                  <ChipList values={row.tags} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DifficultyPill({ value }: { value: HistoryItem['difficulty'] }) {
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

function ChipList({ values }: { values: string[] }) {
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
