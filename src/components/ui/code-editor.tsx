"use client";

import { cn } from "@/lib/utils";
import { useCallback, useRef, useEffect, memo, forwardRef, useImperativeHandle } from "react";

export interface CodeEditorHandle {
  insertAtCursor: (text: string) => void;
}

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: "json" | "yaml" | "markdown";
  placeholder?: string;
  className?: string;
  minHeight?: string;
  debounceMs?: number;
  readOnly?: boolean;
}

const CodeEditorInner = forwardRef<CodeEditorHandle, CodeEditorProps>(function CodeEditorInner({
  value,
  onChange,
  language: _language,
  placeholder,
  className,
  minHeight = "300px",
  debounceMs = 0,
  readOnly = false,
}, ref) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useImperativeHandle(ref, () => ({
    insertAtCursor: (text: string) => {
      const textarea = textareaRef.current;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newValue = value.slice(0, start) + text + value.slice(end);
        onChangeRef.current(newValue);
        requestAnimationFrame(() => {
          textarea.selectionStart = textarea.selectionEnd = start + text.length;
          textarea.focus();
        });
      }
    },
  }), [value]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const val = e.target.value;

      if (debounceMs > 0) {
        if (debounceTimer.current) {
          clearTimeout(debounceTimer.current);
        }
        debounceTimer.current = setTimeout(() => {
          onChangeRef.current(val);
        }, debounceMs);
      } else {
        onChangeRef.current(val);
      }
    },
    [debounceMs]
  );

  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  return (
    <div
      dir="ltr"
      className={cn(
        "border rounded-md overflow-hidden text-left",
        className
      )}
      style={{ minHeight }}
    >
      <textarea
        ref={textareaRef}
        value={value || placeholder}
        onChange={handleChange}
        readOnly={readOnly}
        spellCheck={false}
        className="w-full h-full bg-muted/30 p-3 font-mono text-[11px] leading-relaxed resize-none outline-none"
        style={{ minHeight }}
      />
    </div>
  );
});

export const CodeEditor = memo(CodeEditorInner, (prevProps, nextProps) => {
  return (
    prevProps.value === nextProps.value &&
    prevProps.language === nextProps.language &&
    prevProps.placeholder === nextProps.placeholder &&
    prevProps.className === nextProps.className &&
    prevProps.minHeight === nextProps.minHeight &&
    prevProps.debounceMs === nextProps.debounceMs &&
    prevProps.readOnly === nextProps.readOnly
  );
});
