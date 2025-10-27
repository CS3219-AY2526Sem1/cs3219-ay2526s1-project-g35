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
import { HelpCircle, UploadCloud } from 'lucide-react';
import Link from 'next/link';
import { useRef, useState } from 'react';

type Difficulty = 'Easy' | 'Medium' | 'Hard';

export default function AddQuestionPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty | ''>('');
  const [topics, setTopics] = useState('');
  const [tags, setTags] = useState('');
  const [testCases, setTestCases] = useState<string[]>(['Test Case 1']);

  const [showConfirm, setShowConfirm] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const fileRef = useRef<HTMLInputElement | null>(null);

  const onUploadConfirm = () => {
    if (selectedFileName) {
      setTestCases((prev) => [...prev, selectedFileName]);
    }
    setSelectedFileName('');
    setShowUpload(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const onAddQuestion = () => {
    // TODO: integrate with API create endpoint
    setShowConfirm(false);
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <Header>New Question</Header>

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
              onChange={(e) => setDifficulty(e.target.value as Difficulty | '')}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm text-muted-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Please Select a Difficulty Level</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
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

        <div className="space-y-2">
          <label className="text-sm font-medium">
            Test Cases <span className="text-destructive">*</span>
          </label>
          <div className="rounded-md border p-4">
            <ul className="list-disc pl-5 text-sm">
              {testCases.map((t, i) => (
                <li key={`${t}-${i}`}>{t}</li>
              ))}
            </ul>
            <div className="mt-2">
              <Button variant="link" className="px-0" onClick={() => setShowUpload(true)}>
                + Add New
              </Button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="outline" asChild>
            <Link href="/admin/questions">Cancel</Link>
          </Button>
          <Button
            onClick={(e) => {
              e.preventDefault();
              setShowConfirm(true);
            }}
          >
            Add Question
          </Button>
        </div>
      </form>

      {/* Confirm Add Modal */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <HelpCircle className="h-10 w-10" />
            </div>
            <AlertDialogTitle className="text-center">Add this question?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter className="justify-center gap-3">
            <AlertDialogAction onClick={onAddQuestion} className="min-w-[80px]">
              Yes
            </AlertDialogAction>
            <AlertDialogCancel className="min-w-[80px]">No</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Upload Test Script Modal */}
      <AlertDialog open={showUpload} onOpenChange={setShowUpload}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center">Upload Test Script</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Attach a file containing test cases or evaluation script for this question.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="rounded-md border p-4 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <UploadCloud className="h-7 w-7" />
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".txt,.json,.js,.ts,.py"
              onChange={(e) => setSelectedFileName(e.target.files?.[0]?.name ?? '')}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
            {selectedFileName && (
              <p className="mt-2 text-sm text-muted-foreground">Selected: {selectedFileName}</p>
            )}
          </div>
          <AlertDialogFooter className="justify-center gap-3">
            <AlertDialogAction onClick={onUploadConfirm}>Upload</AlertDialogAction>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
