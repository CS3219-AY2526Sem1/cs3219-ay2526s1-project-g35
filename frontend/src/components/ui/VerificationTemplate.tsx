'use client';

import React, { useCallback, useRef, useState } from 'react';

interface VerificationTemplateProps {
  title: string;
  explanation: string;
  onSubmit?: (code: string) => void;
  onResend?: () => void;
}

export default function VerificationTemplate({
  title,
  explanation,
  onSubmit,
  onResend,
}: VerificationTemplateProps) {
  const length = 6;
  const [values, setValues] = useState<string[]>(Array(length).fill(''));
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const focusAt = useCallback((index: number) => {
    const input = inputsRef.current[index];
    input?.focus();
    input?.select();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const v = e.target.value.replace(/\D/g, '');
    if (!v) {
      setValues((s) => {
        const next = [...s];
        next[idx] = '';
        return next;
      });
      return;
    }

    // If user pasted multiple digits, distribute
    if (v.length > 1) {
      const digits = v.split('');
      setValues((s) => {
        const next = [...s];
        for (let i = 0; i < digits.length && idx + i < length; i++) {
          next[idx + i] = digits[i];
        }
        return next;
      });
      const nextFocus = Math.min(length - 1, idx + v.length - 1);
      focusAt(nextFocus + 1 >= length ? length - 1 : nextFocus + 1);
      return;
    }

    setValues((s) => {
      const next = [...s];
      next[idx] = v;
      // auto-submit when we filled all
      const maybe = next.join('');
      if (maybe.length === length && onSubmit) {
        onSubmit(maybe);
      }
      return next;
    });
    if (idx < length - 1) focusAt(idx + 1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
    const key = e.key;
    if (key === 'Backspace') {
      if (values[idx]) {
        setValues((s) => {
          const next = [...s];
          next[idx] = '';
          return next;
        });
      } else if (idx > 0) {
        focusAt(idx - 1);
      }
    } else if (key === 'ArrowLeft') {
      if (idx > 0) focusAt(idx - 1);
    } else if (key === 'ArrowRight') {
      if (idx < length - 1) focusAt(idx + 1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>, idx: number) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '');
    if (!text) return;
    setValues((s) => {
      const next = [...s];
      for (let i = 0; i < text.length && idx + i < length; i++) {
        next[idx + i] = text[i];
      }
      // auto-submit when we filled all
      const maybe = next.join('');
      if (maybe.length === length && onSubmit) onSubmit(maybe);
      return next;
    });
    const nextFocus = Math.min(length - 1, idx + text.length);
    focusAt(nextFocus);
  };

  // form submission is handled automatically when inputs complete

  return (
    <div className="min-h-(--hscreen) flex items-center justify-center bg-background">
      <div className="w-full max-w-3xl px-6 py-12">
        <div className="flex flex-col items-center gap-6">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">{title}</h1>
          <p className="text-center text-sm md:text-base text-muted-foreground max-w-2xl">
            {explanation}
          </p>

          <form className="w-full flex flex-col items-center gap-6 mt-6">
            <div className="flex items-center justify-center gap-4">
              {values.map((v, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    inputsRef.current[i] = el;
                    return;
                  }}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={v}
                  onChange={(e) => handleChange(e, i)}
                  onKeyDown={(e) => handleKeyDown(e, i)}
                  onPaste={(e) => handlePaste(e, i)}
                  className="w-10 h-14 md:w-12 md:h-16 rounded-md bg-muted/50 border border-input text-center text-xl font-medium focus:border-ring focus:outline-none"
                />
              ))}
            </div>

            <div className="text-sm text-muted-foreground mt-2">
              <span>Didn&apos;t receive the code? </span>
              <button type="button" onClick={onResend} className="underline hover:text-primary">
                Click here to resend the code.
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
