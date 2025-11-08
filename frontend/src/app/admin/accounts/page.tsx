'use client';

import Header from '@/components/ui/Header';
import { Button } from '@/components/ui/button';
import { Edit2, Search, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

interface User {
  id: string;
  username: string;
  email: string;
}

// Sample data - will be replaced with API integration
const sampleUsers: User[] = [
  { id: '1', username: 'user-101', email: 'user101@gmail.com' },
  { id: '2', username: 'User2', email: 'user2@gmail.com' },
  { id: '3', username: 'User3', email: 'user3@gmail.com' },
];

export default function ManageAccountsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = useMemo(() => {
    return sampleUsers.filter(
      (user) =>
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [searchQuery]);

  const handleEdit = (userId: string) => {
    router.push(`/admin/accounts/edit?id=${userId}`);
  };

  const handleDelete = (userId: string) => {
    // TODO: Integrate with API to delete user
    console.log('Delete user:', userId);
  };

  return (
    <div className="container mx-auto max-w-6xl px-4 py-10">
      <Header>Manage User Accounts</Header>

      {/* Search Bar */}
      <div className="mb-6 flex items-center gap-2">
        <Search className="h-5 w-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Enter your search criteria here"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto rounded-lg border bg-card shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-secondary/50">
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">User ID</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                Username
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Email</th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user, index) => (
                <tr
                  key={user.id}
                  className="border-b last:border-0 hover:bg-secondary/30 transition-colors"
                >
                  <td className="px-6 py-4 text-sm text-foreground">{index + 1}</td>
                  <td className="px-6 py-4 text-sm text-foreground">{user.username}</td>
                  <td className="px-6 py-4 text-sm text-foreground">{user.email}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleEdit(user.id)}
                        className="gap-2"
                      >
                        <Edit2 className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(user.id)}
                        className="gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-sm text-muted-foreground">
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
