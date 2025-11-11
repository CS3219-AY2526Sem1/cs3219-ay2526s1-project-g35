'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import Header from '@/components/ui/Header';
import userService, { UserServiceError } from '@/services/user.service';
import { AdminUsersPagination, UserData } from '@/types/user.types';
import { Edit2 } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState, type KeyboardEventHandler } from 'react';

const PAGE_SIZE = 10;
type RoleFilter = 'all' | 'admin' | 'user';

export default function ManageAccountsPage() {
  const [searchInput, setSearchInput] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [users, setUsers] = useState<UserData[]>([]);
  const [pagination, setPagination] = useState<AdminUsersPagination>({
    total: 0,
    page: 1,
    limit: PAGE_SIZE,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = useCallback(async (page: number, query: string, role: RoleFilter) => {
    try {
      setLoading(true);
      setError(null);

      const response = await userService.fetchUsers({ page, limit: PAGE_SIZE, query, role });
      const { users: fetchedUsers = [], pagination: paginationMeta } = response.data ?? {
        users: [],
        pagination: undefined,
      };

      const nextPagination = paginationMeta ?? {
        total: fetchedUsers.length,
        page,
        limit: PAGE_SIZE,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: page > 1,
      };

      setUsers(fetchedUsers);
      setPagination(nextPagination);

      if (nextPagination.page !== page) {
        setCurrentPage(nextPagination.page);
      }
    } catch (err) {
      console.error('Failed to load users', err);
      const message = err instanceof UserServiceError ? err.message : 'Unable to load users.';
      setError(message);
      setUsers([]);
      setPagination({
        total: 0,
        page: 1,
        limit: PAGE_SIZE,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers(currentPage, activeQuery, roleFilter);
  }, [loadUsers, currentPage, activeQuery, roleFilter]);

  const handleSearch = () => {
    const trimmed = searchInput.trim();

    if (trimmed === activeQuery && currentPage === 1) {
      void loadUsers(1, trimmed, roleFilter);
      return;
    }

    if (currentPage !== 1) {
      setCurrentPage(1);
    }
    setActiveQuery(trimmed);
  };

  const handleSearchKeyDown: KeyboardEventHandler<HTMLInputElement> = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSearch();
    }
  };

  const handlePageChange = (nextPage: number) => {
    if (nextPage < 1 || nextPage === currentPage || nextPage > pagination.totalPages) {
      return;
    }
    setCurrentPage(nextPage);
  };

  const handleRoleChange = (value: RoleFilter) => {
    setCurrentPage(1);
    setRoleFilter(value);
  };

  const startIndex = useMemo(
    () => Math.max(0, (pagination.page - 1) * pagination.limit),
    [pagination.page, pagination.limit],
  );

  const tableRows = useMemo(() => {
    return users.map((user, index) => ({
      ...user,
      rowNumber: startIndex + index + 1,
    }));
  }, [users, startIndex]);

  return (
    <div className="container mx-auto max-w-6xl px-4 py-10">
      <Header className="text-center">Manage User Accounts</Header>

      <div className="mb-4 flex justify-center">
        <input
          type="text"
          placeholder="Search by username or email"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          onKeyDown={handleSearchKeyDown}
          className="w-full rounded-md border bg-background px-4 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary md:w-[720px]"
        />
      </div>

      <div className="mb-6 flex flex-col items-center gap-3">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <RoleFilterDropdown value={roleFilter} onChange={handleRoleChange} />
        </div>
        {error && <p className="text-center text-sm text-destructive">{error}</p>}
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card text-card-foreground shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-muted-foreground">
            <tr className="border-b [&_th]:px-6 [&_th]:py-4">
              <th className="text-left w-[80px]">ID No.</th>
              <th className="text-left min-w-[180px]">Username</th>
              <th className="text-left min-w-[220px]">Email</th>
              <th className="text-left w-[120px]">Role</th>
              <th className="text-left min-w-[180px]">Last Updated</th>
              <th className="text-left min-w-[180px]">Last Login</th>
              <th className="text-center w-[120px]">Actions</th>
            </tr>
          </thead>
          <tbody className="[&_td]:px-6 [&_td]:py-4">
            {loading && users.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-muted-foreground">
                  Loading user accounts...
                </td>
              </tr>
            ) : tableRows.length > 0 ? (
              tableRows.map((user) => (
                <tr key={user.id} className="border-b last:border-0 transition hover:bg-muted/40">
                  <td className="align-top text-muted-foreground">{user.rowNumber}</td>
                  <td className="align-top font-medium">{user.username}</td>
                  <td className="align-top break-words">{user.email}</td>
                  <td className="align-top">
                    <RoleBadge isAdmin={user.isAdmin} />
                  </td>
                  <td className="align-top text-muted-foreground">{formatDate(user.updatedAt)}</td>
                  <td className="align-top text-muted-foreground">{formatDate(user.lastLogin)}</td>
                  <td className="align-top">
                    <div className="flex items-center justify-center">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/accounts/edit?id=${user.id}`} className="gap-2">
                          <Edit2 className="h-4 w-4" />
                          Edit
                        </Link>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="py-8 text-center text-muted-foreground">
                  {error ? 'Unable to display users right now.' : 'No users found for this query.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex items-center justify-center gap-4">
        <Button
          variant="outline"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={loading || !pagination.hasPreviousPage}
        >
          Previous
        </Button>
        <span className="text-sm text-muted-foreground">
          Page {Math.min(currentPage, pagination.totalPages)} of {pagination.totalPages}
        </span>
        <Button
          variant="outline"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={loading || !pagination.hasNextPage}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

function RoleBadge({ isAdmin }: { isAdmin: boolean }) {
  const label = isAdmin ? 'Admin' : 'User';
  const roleClass = isAdmin
    ? 'bg-primary/10 text-primary border-primary/20'
    : 'bg-muted text-muted-foreground border-muted/60';

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${roleClass}`}
    >
      {label}
    </span>
  );
}

function RoleFilterDropdown({
  value,
  onChange,
}: {
  value: RoleFilter;
  onChange: (value: RoleFilter) => void;
}) {
  const label = value === 'admin' ? 'Role: Admin' : value === 'user' ? 'Role: User' : 'Role: All';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="min-w-[180px] justify-between">
          <span>{label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(nextValue) =>
            onChange(nextValue === 'admin' || nextValue === 'user' ? nextValue : 'all')
          }
        >
          <DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="admin">Admin</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="user">User</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return '—';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
