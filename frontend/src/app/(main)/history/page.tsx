'use client';

import HistoryTable, { type HistoryItem } from '@/components/HistoryTable';
import Header from '@/components/ui/Header';

const sampleData: HistoryItem[] = [
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
  {
    id: 6,
    title: 'N-Queens',
    difficulty: 'Hard',
    topics: ['SSSP'],
    tags: ['Completed'],
  },
];

export default function HistoryPage() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-10">
      <Header className="text-center">History</Header>
      <HistoryTable items={sampleData} />
    </div>
  );
}
