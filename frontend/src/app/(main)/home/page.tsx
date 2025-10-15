"use client";

import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/Carousel";
import Autoplay from "embla-carousel-autoplay";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function HomePage() {
  const router = useRouter();

  const [selectedTopic, setSelectedTopic] = useState<number | null>(0);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(
    null
  );

  const topics = [
    "Two Pointers",
    "Sliding Window",
    "Sorting",
    "Binary Search",
    "Dynamic Programming",
    "Greedy Algorithms",
  ];

  const difficulties = ["Easy", "Medium", "Hard"];

  const goWaiting = () => router.push("/waitingroom");

  const onSelectTopic = (index: number) => setSelectedTopic(index);
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
      <section id="topics" className="w-full">
        <h2 className="text-3xl text-center">
          Which topic(s) would you like to practice today?
        </h2>
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
          {/* topics mapped from array */}
          <CarouselContent className="-ml-6">
            {topics.map((t, i) => (
              <CarouselItem
                key={t}
                className="basis-1/3 lg:basis-1/4 pl-6 py-2 h-50"
              >
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectTopic(i)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") onSelectTopic(i);
                  }}
                  className={`shadow-[0_0_8px_rgba(0,0,0,0.12)] flex items-center justify-center h-full rounded-2xl border-1 cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                    selectedTopic === i ? "ring-2 ring-ring scale-105" : ""
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
        {/* difficulties mapped from array */}
        <div className="w-3/4 mt-14 max-w-[1050px] mx-auto flex justify-center h-50 py-2">
          {difficulties.map((d) => (
            <div
              key={d}
              role="button"
              tabIndex={0}
              onClick={() => onSelectDifficulty(d)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") onSelectDifficulty(d);
              }}
              className={`basis-1/3 mx-3 h-full shadow-[0_0_8px_rgba(0,0,0,0.12)] flex items-center justify-center rounded-2xl border-1 cursor-pointer transition ${
                selectedDifficulty === d
                  ? "ring-2 ring-ring scale-105"
                  : "hover:shadow-lg"
              }`}
            >
              <label className="text-2xl block text-center">{d}</label>
            </div>
          ))}
        </div>
      </section>
      <Button
        onClick={goWaiting}
        className="block mx-auto"
        variant="attention"
        size="lg"
      >
        Find a match!
      </Button>
    </div>
  );
}
