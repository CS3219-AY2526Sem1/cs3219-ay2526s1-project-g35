import { redirect } from 'next/navigation';

export default function Page() {
  // Server-side redirect to /login
  redirect('/login');
}
