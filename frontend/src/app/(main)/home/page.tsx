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

export default function HomePage() {
  return (
    <div className="h-(--hscreen) w-full py-4 px-3 flex flex-col items-center justify-center gap-28">
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
          {/* TODO: Convert to a map function using database data */}
          <CarouselContent className="-ml-6">
            <CarouselItem className="basis-1/3 lg:basis-1/4 pl-6 py-2 h-50">
              <div className="shadow-[0_0_8px_rgba(0,0,0,0.12)] flex items-center justify-center h-full rounded-2xl border-1 focus:shadow-attention/15 focus:outline-none">
                <label className="text-2xl block text-center">
                  Two Pointers
                </label>
              </div>
            </CarouselItem>
            <CarouselItem className="basis-1/3 lg:basis-1/4 pl-6 py-2 h-50">
              <div className="shadow-[0_0_8px_rgba(0,0,0,0.12)] flex items-center justify-center h-full rounded-2xl border-1">
                <label className="text-2xl block text-center">
                  Sliding Window
                </label>
              </div>
            </CarouselItem>
            <CarouselItem className="basis-1/3 lg:basis-1/4 pl-6 py-2 h-50">
              <div className="shadow-[0_0_8px_rgba(0,0,0,0.12)] flex items-center justify-center h-full rounded-2xl border-1">
                <label className="text-2xl block text-center">Sorting</label>
              </div>
            </CarouselItem>
            <CarouselItem className="basis-1/3 lg:basis-1/4 pl-6 py-2 h-50">
              <div className="shadow-[0_0_8px_rgba(0,0,0,0.12)] flex items-center justify-center h-full rounded-2xl border-1">
                <label className="text-2xl block text-center">
                  Binary Search
                </label>
              </div>
            </CarouselItem>
            <CarouselItem className="basis-1/3 lg:basis-1/4 pl-6 py-2 h-50">
              <div className="shadow-[0_0_8px_rgba(0,0,0,0.12)] flex items-center justify-center h-full rounded-2xl border-1">
                <label className="text-2xl block text-center">
                  Dynamic Programming
                </label>
              </div>
            </CarouselItem>
            <CarouselItem className="basis-1/3 lg:basis-1/4 pl-6 py-2 h-50">
              <div className="shadow-[0_0_8px_rgba(0,0,0,0.12)] flex items-center justify-center h-full rounded-2xl border-1">
                <label className="text-2xl block text-center">
                  Greedy Algorithms
                </label>
              </div>
            </CarouselItem>
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </section>
      <section id="difficulty" className="w-full">
        <h2 className="text-3xl text-center">
          Select your desired difficulty level for the questions
        </h2>
        {/* TODO: Convert to a map function using database data */}
        <div className="w-3/4 mt-14 max-w-[1050px] mx-auto flex justify-center h-50 py-2">
          <div className="basis-1/3 mx-3 h-full shadow-[0_0_8px_rgba(0,0,0,0.12)] flex items-center justify-center rounded-2xl border-1">
            <label className="text-2xl block text-center">Easy</label>
          </div>
          <div className="basis-1/3 mx-3 h-full shadow-[0_0_8px_rgba(0,0,0,0.12)] flex items-center justify-center rounded-2xl border-1">
            <label className="text-2xl block text-center">Medium</label>
          </div>
          <div className="basis-1/3 mx-3 h-full shadow-[0_0_8px_rgba(0,0,0,0.12)] flex items-center justify-center rounded-2xl border-1">
            <label className="text-2xl block text-center">Hard</label>
          </div>
        </div>
      </section>
      <Button className="block mx-auto" variant="attention" size="lg">
        Find a match!
      </Button>
    </div>
  );
}
