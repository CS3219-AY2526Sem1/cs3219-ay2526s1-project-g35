'use client';

import React, { useRef } from 'react';
import { Editor } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';

interface MonacoCodeEditorProps {
  value: string;
  language: string;
  onChange?: (value: string) => void;
  onCursorChange?: (position: { line: number; column: number }) => void;
  readOnly?: boolean;
  theme?: 'vs' | 'vs-dark' | 'hc-black';
  height?: string;
  options?: editor.IStandaloneEditorConstructionOptions;
}

const MonacoCodeEditor: React.FC<MonacoCodeEditorProps> = ({
  value,
  language,
  onChange,
  onCursorChange,
  readOnly = false,
  theme = 'vs',
  height = '100%',
  options = {},
}) => {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;

    // Configure cursor change listener
    if (onCursorChange) {
      editor.onDidChangeCursorPosition((e) => {
        onCursorChange({
          line: e.position.lineNumber,
          column: e.position.column,
        });
      });
    }

    // Configure editor options
    editor.updateOptions({
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      lineNumbers: 'on',
      glyphMargin: false,
      folding: true,
      lineDecorationsWidth: 10,
      lineNumbersMinChars: 3,
      renderLineHighlight: 'line',
      automaticLayout: true,
      ...options,
    });
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined && onChange) {
      onChange(value);
    }
  };

  const getMonacoLanguage = (language: string): string => {
    const languageMap: Record<string, string> = {
      javascript: 'javascript',
      python: 'python',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      csharp: 'csharp',
      typescript: 'typescript',
      html: 'html',
      css: 'css',
      json: 'json',
      xml: 'xml',
      yaml: 'yaml',
      markdown: 'markdown',
    };
    return languageMap[language] || 'plaintext';
  };

  const defaultOptions: editor.IStandaloneEditorConstructionOptions = {
    fontSize: 14,
    fontFamily: "'Monaco', 'Menlo', 'Ubuntu Mono', monospace",
    lineHeight: 1.5,
    tabSize: 2,
    insertSpaces: true,
    wordWrap: 'on',
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    automaticLayout: true,
    readOnly,
    contextmenu: true,
    mouseWheelZoom: true,
    smoothScrolling: true,
    cursorBlinking: 'blink',
    cursorSmoothCaretAnimation: 'on',
    ...options,
  };

  return (
    <div style={{ height, width: '100%' }}>
      <Editor
        height={height}
        language={getMonacoLanguage(language)}
        value={value}
        theme={theme}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        options={defaultOptions}
        loading={<div style={{ padding: '20px', textAlign: 'center' }}>Loading editor...</div>}
      />
    </div>
  );
};

export default MonacoCodeEditor;

