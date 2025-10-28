'use client';

import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/Carousel';
import { fetchCategories, fetchDifficulties } from '@/services/question.service';
import Autoplay from 'embla-carousel-autoplay';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function HomePage() {
  const router = useRouter();

  // Data from Question Service
  const [topics, setTopics] = useState<string[]>([]);
  const [difficulties, setDifficulties] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Selections (support multiple topics)
  const [selectedTopics, setSelectedTopics] = useState<number[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([fetchCategories(), fetchDifficulties()])
      .then(([cats, diffs]) => {
        if (cancelled) return;
        setTopics(cats);

        // Sort difficulties in desired order
        const difficultyOrder = ['Easy', 'Medium', 'Hard'];
        const sortedDiffs = diffs.sort((a, b) => {
          const indexA = difficultyOrder.indexOf(a);
          const indexB = difficultyOrder.indexOf(b);
          return indexA - indexB;
        });

        setDifficulties(sortedDiffs);

        // Default-select first topic for convenience
        if (cats.length > 0) setSelectedTopics([0]);
      })
      .catch((e) => {
        if (cancelled) return;
        console.error('Failed to load topics/difficulties:', e);
        setError('Failed to load topics and difficulties. Please try again.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const goWaiting = () => {
    // Validate selections
    if (selectedTopics.length === 0) {
      setError('Please select at least one topic');
      return;
    }
    if (!selectedDifficulty) {
      setError('Please select a difficulty level');
      return;
    }

    setError(null);

    // Get selected topic names
    const selectedTopicNames = selectedTopics
      .map((i) => topics[i])
      .filter((t) => typeof t === 'string' && t.length > 0);

    // Store search data for waiting room page
    sessionStorage.setItem(
      'matchingSearch',
      JSON.stringify({
        topics: selectedTopicNames,
        difficulty: selectedDifficulty,
        userId: 'user-' + Math.random().toString(36).substr(2, 9),
        username: 'User' + Math.floor(Math.random() * 1000),
      }),
    );

    // Navigate to waiting room
    router.push('/waitingroom');
  };

  const onToggleTopic = (index: number) =>
    setSelectedTopics((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    );
  const onSelectDifficulty = (d: string) => setSelectedDifficulty(d);

  return (
    <div className="min-h-(--hscreen) w-full py-4 px-3 flex flex-col items-center justify-center gap-28">
      <header>
        <h1 className="text-5xl text-center">
          Welcome to <b className="tracking-widest">PeerPrep</b>!
        </h1>
        <p className="text-xl text-center mt-4 text-(--muted-foreground)">
          Let&apos;s get you matched up!
        </p>
      </header>

      {error && (
        <div className="w-full max-w-[600px] p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
          {error}
        </div>
      )}

      {loading && (
        <div className="w-full max-w-[600px] p-4 text-sm text-center text-(--muted-foreground) border border-border rounded-md">
          Loading topics and difficulties...
        </div>
      )}

      <section id="topics" className="w-full">
        <h2 className="text-3xl text-center">Which topic(s) would you like to practice today?</h2>
        <Carousel
          orientation="horizontal"
          opts={{ loop: true }}
          className="w-[90%] mt-14 max-w-[1400px] mx-auto"
          plugins={[
            Autoplay({
              delay: 3200,
            }),
          ]}
        >
          {/* topics mapped from API */}
          <CarouselContent className="-ml-6">
            {topics.map((t, i) => (
              <CarouselItem key={t} className="basis-1/3 lg:basis-1/4 pl-6 py-2 h-50">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => onToggleTopic(i)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') onToggleTopic(i);
                  }}
                  className={`shadow-[0_0_8px_rgba(0,0,0,0.12)] flex items-center justify-center h-full rounded-2xl border-1 cursor-pointer transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                    selectedTopics.includes(i) ? 'ring-2 ring-ring scale-105' : 'hover:shadow-lg'
                  }`}
                >
                  <label className="text-2xl block text-center">{t}</label>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </section>
      <section id="difficulty" className="w-full">
        <h2 className="text-3xl text-center">
          Select your desired difficulty level for the questions
        </h2>
        {/* difficulties mapped from API */}
        <div className="w-3/4 mt-14 max-w-[1050px] mx-auto flex justify-center h-50 py-2">
          {difficulties.map((d) => (
            <div
              key={d}
              role="button"
              tabIndex={0}
              onClick={() => onSelectDifficulty(d)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onSelectDifficulty(d);
              }}
              className={`basis-1/3 mx-3 h-full shadow-[0_0_8px_rgba(0,0,0,0.12)] flex items-center justify-center rounded-2xl border-1 cursor-pointer transition ${
                selectedDifficulty === d ? 'ring-2 ring-ring scale-105' : 'hover:shadow-lg'
              }`}
            >
              <label className="text-2xl block text-center">{d}</label>
            </div>
          ))}
        </div>
      </section>
      <Button onClick={goWaiting} className="block mx-auto" variant="attention" size="lg">
        Find a match!
      </Button>
    </div>
  );
}
