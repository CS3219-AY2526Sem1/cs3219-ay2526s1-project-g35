'use client';

import { Fragment } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export type HistoryItem = {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  created_at: string;
  session_id?: string;
};

type Props = {
  items: HistoryItem[];
  className?: string;
  // Pagination props
  currentPage?: number;
  totalItems?: number;
  itemsPerPage?: number;
  onPageChange?: (page: number) => void;
  isLoading?: boolean;
};

/**
 * Simple, accessible table styled with Tailwind.
 * Designed to match the look-and-feel in the History mock.
 */
export default function HistoryTable({
  items,
  className,
  currentPage = 1,
  totalItems = 0,
  itemsPerPage = 10,
  onPageChange,
  isLoading = false,
}: Props) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={`w-full ${className ?? ''}`}>
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_th]:py-3 [&_th]:px-4">
              <tr className="border-b bg-muted/60 text-muted-foreground">
                <th className="text-left w-[90px]">No.</th>
                <th className="text-left min-w-[120px]">Session ID</th>
                <th className="text-left min-w-[220px]">Question Title</th>
                <th className="text-left w-[110px]">Difficulty</th>
                <th className="text-left min-w-[150px]">Category</th>
                <th className="text-left min-w-[180px]">Date Attempted</th>
              </tr>
            </thead>
            <tbody className="[&_td]:py-4 [&_td]:px-4">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-muted-foreground">
                    Loading...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-muted-foreground">
                    No history entries found
                  </td>
                </tr>
              ) : (
                items.map((row, index) => (
                  <tr key={row.id} className="border-b last:border-0 hover:bg-muted/40">
                    <td className="align-top text-muted-foreground">{startIndex + index}</td>
                    <td className="align-top text-muted-foreground text-xs">
                      {row.session_id || '—'}
                    </td>
                    <td className="align-top font-medium">{row.title}</td>
                    <td className="align-top">
                      <DifficultyPill value={row.difficulty} />
                    </td>
                    <td className="align-top">
                      <span className="inline-flex items-center rounded-md border px-2 py-1 text-xs text-muted-foreground">
                        {row.category}
                      </span>
                    </td>
                    <td className="align-top text-muted-foreground text-xs">
                      {formatDate(row.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex} to {endIndex} of {totalItems} entries
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange?.(currentPage - 1)}
                disabled={currentPage === 1 || isLoading}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                    // Show first page, last page, current page, and pages around current
                    return page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1;
                  })
                  .map((page, index, arr) => {
                    // Add ellipsis if there's a gap
                    const showEllipsisBefore = index > 0 && page - arr[index - 1] > 1;
                    return (
                      <Fragment key={page}>
                        {showEllipsisBefore && (
                          <span className="px-2 text-muted-foreground">...</span>
                        )}
                        <Button
                          variant={currentPage === page ? 'default' : 'outline'}
                          size="sm"
                          className="w-9"
                          onClick={() => onPageChange?.(page)}
                          disabled={isLoading}
                        >
                          {page}
                        </Button>
                      </Fragment>
                    );
                  })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange?.(currentPage + 1)}
                disabled={currentPage === totalPages || isLoading}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
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
