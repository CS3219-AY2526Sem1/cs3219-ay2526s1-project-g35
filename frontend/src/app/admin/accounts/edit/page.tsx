'use client';

import Header from '@/components/ui/Header';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, HelpCircle } from 'lucide-react';
import { useMemo, useState } from 'react';

export default function EditAccountPage() {
  // TODO: Use URL query parameter for user id when integrating with user service
  // const params = useSearchParams();
  // const id = params.get('id') ?? '1';

  // Placeholder data – in real integration, fetch by id
  const initial = useMemo(
    () => ({
      username: 'ab-101',
      email: 'peerprepfb@gmail.com',
      password: '****123',
    }),
    [],
  );

  const [username, setUsername] = useState(initial.username);
  const [email, setEmail] = useState(initial.email);
  const [password, setPassword] = useState(initial.password);

  const [showSave, setShowSave] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const onSaveConfirm = () => {
    // TODO: integrate API call
    setShowSave(false);
  };

  const onDeleteConfirm = () => {
    // TODO: integrate API call
    setShowDelete(false);
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <Header>Edit Account Details</Header>

      <form className="space-y-6 bg-card rounded-lg border p-6 shadow-sm">
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Username <span className="text-destructive">*</span>
          </label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Enter username"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            Email <span className="text-destructive">*</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Enter email"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            Password <span className="text-destructive">*</span>
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Enter password"
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="button" onClick={() => setShowSave(true)} className="flex-1">
            Save Changes
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => setShowDelete(true)}
            className="flex-1"
          >
            Delete Account
          </Button>
        </div>
      </form>

      {/* Save Confirmation Modal */}
      <AlertDialog open={showSave} onOpenChange={setShowSave}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex justify-center mb-2">
              <HelpCircle className="h-12 w-12 text-primary" />
            </div>
            <AlertDialogTitle className="text-center">Save These Changes?</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Are you sure you want to save these changes?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="justify-center gap-3 pt-2">
            <AlertDialogCancel className="min-w-[80px]">No</AlertDialogCancel>
            <AlertDialogAction onClick={onSaveConfirm} className="min-w-[80px]">
              Yes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Modal */}
      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex justify-center mb-2">
              <AlertCircle className="h-12 w-12 text-destructive" />
            </div>
            <AlertDialogTitle className="text-center">
              Are you sure you want to delete this account?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-destructive">
              This action is irreversible!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="justify-center gap-3 pt-2">
            <AlertDialogCancel className="min-w-[80px]">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDeleteConfirm}
              className="min-w-[80px] bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
