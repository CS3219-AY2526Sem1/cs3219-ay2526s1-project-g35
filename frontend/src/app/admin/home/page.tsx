'use client';

import Header from '@/components/ui/Header';
import { Sparkline } from '@/components/ui/Sparkline';

const visits = [2, 5, 1, 6, 1, 1];
const downtime = [6, 1, 5, 3, 6, 2];

export default function AdminHomePage() {
  return (
    <div className="container mx-auto max-w-6xl px-4 py-10">
      <div className="text-center mb-8">
        <Header className="mb-2">Welcome to PeerPrep!</Header>
        <p className="text-muted-foreground">Let’s get you matched up!</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Sparkline title="Number of Site Visits" data={visits} colorClass="text-primary" />
        <Sparkline
          title="System Downtime"
          data={downtime}
          colorClass="text-teal-400 dark:text-teal-300"
        />
      </div>
    </div>
  );
}
