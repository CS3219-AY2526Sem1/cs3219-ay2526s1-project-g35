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
import { useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';

type Difficulty = 'Easy' | 'Medium' | 'Hard';

export default function EditQuestionPage() {
  const params = useSearchParams();
  const id = params.get('id') ?? '1'; // placeholder id

  // Placeholder data – in real integration, fetch by id
  const initial = useMemo(
    () => ({
      title: 'Two Sum',
      description:
        'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice. You can return the answer in any order.',
      difficulty: 'Easy' as Difficulty,
      topics: 'HashMap',
      tags: 'Beginner-friendly, Completed',
    }),
    [],
  );

  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [difficulty, setDifficulty] = useState<Difficulty>(initial.difficulty);
  const [topics, setTopics] = useState(initial.topics);
  const [tags, setTags] = useState(initial.tags);

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
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <Header>Edit Question</Header>

      <form className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Title <span className="text-destructive">*</span>
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Enter question title"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            Description <span className="text-destructive">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-32 w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Difficulty <span className="text-destructive">*</span>
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as Difficulty)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option>Easy</option>
              <option>Medium</option>
              <option>Hard</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Topics <span className="text-destructive">*</span>
            </label>
            <input
              value={topics}
              onChange={(e) => setTopics(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Comma-separated topics"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            Tags <span className="text-destructive">*</span>
          </label>
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Comma-separated tags"
          />
        </div>

        <div className="flex items-center justify-between pt-4">
          <Button type="button" variant="destructive" onClick={() => setShowDelete(true)}>
            Delete Question
          </Button>
          <Button type="button" onClick={() => setShowSave(true)}>
            Save Changes
          </Button>
        </div>
      </form>

      {/* Save Confirmation Modal */}
      <AlertDialog open={showSave} onOpenChange={setShowSave}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <HelpCircle className="h-10 w-10" />
            </div>
            <AlertDialogTitle className="text-center">Save These Changes?</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Your updates will be applied to question #{id}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="justify-center gap-3">
            <AlertDialogAction onClick={onSaveConfirm} className="min-w-[80px]">
              Yes
            </AlertDialogAction>
            <AlertDialogCancel className="min-w-[80px]">No</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Modal */}
      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertCircle className="h-10 w-10" />
            </div>
            <AlertDialogTitle className="text-center">
              Are you sure you want to delete this question?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              This action is irreversible!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="justify-center gap-3">
            <Button variant="destructive" onClick={onDeleteConfirm} className="min-w-[88px]">
              Delete
            </Button>
            <AlertDialogCancel className="min-w-[88px]">Cancel</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
