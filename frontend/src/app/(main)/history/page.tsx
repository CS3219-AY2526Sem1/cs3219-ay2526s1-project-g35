'use client';

import { useEffect, useState } from 'react';
import HistoryTable, { type HistoryItem } from '@/components/HistoryTable';
import Header from '@/components/ui/Header';
import { useAuth } from '@/contexts/AuthContext';
import historyService, { HistoryEntry } from '@/services/history.service';
import { useRouter } from 'next/navigation';

const ITEMS_PER_PAGE = 10;

export default function HistoryPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [historyData, setHistoryData] = useState<HistoryItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    // Fetch history when user is available
    if (user?.id) {
      fetchHistory(currentPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, currentPage, isAuthenticated, router]);

  const fetchHistory = async (page: number) => {
    if (!user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const offset = (page - 1) * ITEMS_PER_PAGE;
      const response = await historyService.getUserHistory(user.id, ITEMS_PER_PAGE, offset);

      // Transform API response to match HistoryItem interface
      const transformedData: HistoryItem[] = response.data.map((entry: HistoryEntry) => {
        // Ensure created_at is a string, not an object
        let created_at = entry.created_at;
        if (created_at && typeof created_at === 'object') {
          created_at = new Date(created_at).toISOString();
        } else if (created_at && typeof created_at !== 'string') {
          created_at = String(created_at);
        }
        
        return {
          id: entry.id,
          title: entry.question_title,
          difficulty: entry.difficulty,
          category: entry.category,
          status: entry.status || 'attempted',
          created_at: created_at || new Date().toISOString(),
          session_id: entry.session_id,
        };
      });

      setHistoryData(transformedData);
      setTotalItems(response.count);
    } catch (err) {
      console.error('Failed to fetch history:', err);
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-10">
      <Header className="text-center mb-8">History</Header>

      {error && (
        <div className="mb-4 p-4 bg-destructive/10 border border-destructive rounded-lg text-destructive text-center">
          {error}
        </div>
      )}

      <HistoryTable
        items={historyData}
        currentPage={currentPage}
        totalItems={totalItems}
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={handlePageChange}
        isLoading={isLoading}
      />
    </div>
  );
}
