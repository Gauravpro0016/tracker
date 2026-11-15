"use client";

import React, { useMemo, useState } from "react";
import katex from "katex";
import { Copy, Check } from "lucide-react";

interface FormattedContentProps {
  content: string;
  className?: string;
}

/**
 * Safely render a LaTeX expression using KaTeX
 */
function renderKatex(tex: string, displayMode: boolean): string | null {
  try {
    return katex.renderToString(tex.trim(), {
      displayMode,
      throwOnError: false,
    });
  } catch {
    return null;
  }
}

/**
 * Parse inline text with KaTeX formulas, bold, italic, code, links
 */
function InlineContent({ text }: { text: string }) {
  const elements = useMemo(() => {
    if (!text) return null;

    // Pattern to split by:
    // 1. Inline math: $...$ or \(...\)
    // 2. Inline code: `...`
    // 3. Bold: **...**
    // 4. Italic: *...*
    // 5. Links: [label](url)
    const tokenRegex = /(\$(?:[^\$\n]+)\$|\\\([^\)]+\\\)|`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
    const parts = text.split(tokenRegex);

    return parts.map((part, idx) => {
      if (!part) return null;

      // Inline Math: $...$ or \(...\)
      if (
        (part.startsWith("$") && part.endsWith("$") && part.length > 2) ||
        (part.startsWith("\\(") && part.endsWith("\\)") && part.length > 4)
      ) {
        const mathContent = part.startsWith("$")
          ? part.slice(1, -1)
          : part.slice(2, -2);
        const html = renderKatex(mathContent, false);

        if (html) {
          return (
            <span
              key={idx}
              className="inline-math px-0.5 align-middle"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        }
        return <span key={idx} className="font-mono text-xs">{mathContent}</span>;
      }

      // Inline Code: `...`
      if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
        return (
          <code
            key={idx}
            className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-200 font-mono text-[13px] border border-neutral-700/60"
          >
            {part.slice(1, -1)}
          </code>
        );
      }

      // Bold: **...**
      if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
        return (
          <strong key={idx} className="font-bold text-white">
            <InlineContent text={part.slice(2, -2)} />
          </strong>
        );
      }

      // Italic: *...*
      if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
        return (
          <em key={idx} className="italic text-neutral-300">
            <InlineContent text={part.slice(1, -1)} />
          </em>
        );
      }

      // Links: [label](url)
      const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        return (
          <a
            key={idx}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-violet-400 hover:text-violet-300 underline underline-offset-2"
          >
            {linkMatch[1]}
          </a>
        );
      }

      // Raw LaTeX formula check (e.g. \frac{a}{b} or \tan(\theta) without $)
      if (
        (part.includes("\\frac{") || part.includes("\\sqrt{") || part.includes("\\tan(") || part.includes("\\sin(")) &&
        !part.includes("<")
      ) {
        const fallbackHtml = renderKatex(part, false);
        if (fallbackHtml) {
          return (
            <span
              key={idx}
              className="inline-math px-0.5 align-middle"
              dangerouslySetInnerHTML={{ __html: fallbackHtml }}
            />
          );
        }
      }

      return <span key={idx}>{part}</span>;
    });
  }, [text]);

  return <>{elements}</>;
}

/**
 * Code Block with Copy action
 */
function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="my-3 rounded-xl overflow-hidden border border-neutral-800 bg-black shadow-lg">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-neutral-900 border-b border-neutral-800 text-[11px] text-neutral-400">
        <span className="font-mono uppercase font-semibold">{language || "code"}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 hover:text-white transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3.5 text-xs text-neutral-200 font-mono overflow-x-auto leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

/**
 * Main Markdown and Math Content Formatter
 */
export default function FormattedContent({ content, className = "" }: FormattedContentProps) {
  const renderedBlocks = useMemo(() => {
    if (!content) return null;

    // 1. Separate code blocks: ```lang ... ```
    const codeBlockRegex = /(```[\s\S]*?```)/g;
    const initialSegments = content.split(codeBlockRegex);

    const blocks: React.ReactNode[] = [];

    initialSegments.forEach((segment, segIdx) => {
      if (!segment) return;

      // Handle Code Block
      if (segment.startsWith("```") && segment.endsWith("```")) {
        const lines = segment.slice(3, -3).trim().split("\n");
        let language = "";
        let code = "";

        if (lines[0] && !lines[0].includes(" ") && lines.length > 1) {
          language = lines[0].trim();
          code = lines.slice(1).join("\n");
        } else {
          code = lines.join("\n");
        }

        blocks.push(<CodeBlock key={`code-${segIdx}`} code={code} language={language} />);
        return;
      }

      // 2. Separate Display Math: $$ ... $$ or \[ ... \]
      const displayMathRegex = /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\])/g;
      const mathSegments = segment.split(displayMathRegex);

      mathSegments.forEach((mathPart, mIdx) => {
        if (!mathPart) return;

        // Display / Block Math
        if (
          (mathPart.startsWith("$$") && mathPart.endsWith("$$")) ||
          (mathPart.startsWith("\\[") && mathPart.endsWith("\\]"))
        ) {
          const rawMath = mathPart.startsWith("$$")
            ? mathPart.slice(2, -2)
            : mathPart.slice(2, -2);
          const html = renderKatex(rawMath, true);

          if (html) {
            blocks.push(
              <div
                key={`math-${segIdx}-${mIdx}`}
                className="my-3.5 p-3 rounded-2xl bg-neutral-950/80 border border-neutral-800 text-center overflow-x-auto shadow-inner"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
            return;
          }
        }

        // 3. Process regular text paragraphs, headers, and lists
        const lines = mathPart.split("\n");
        let currentList: { type: "ul" | "ol"; items: string[] } | null = null;

        const flushList = (listKey: string) => {
          if (!currentList) return;
          if (currentList.type === "ul") {
            blocks.push(
              <ul key={listKey} className="my-2 space-y-1 list-disc pl-5 text-neutral-300">
                {currentList.items.map((it, iIdx) => (
                  <li key={iIdx}>
                    <InlineContent text={it} />
                  </li>
                ))}
              </ul>
            );
          } else {
            blocks.push(
              <ol key={listKey} className="my-2 space-y-1 list-decimal pl-5 text-neutral-300">
                {currentList.items.map((it, iIdx) => (
                  <li key={iIdx}>
                    <InlineContent text={it} />
                  </li>
                ))}
              </ol>
            );
          }
          currentList = null;
        };

        lines.forEach((line, lineIdx) => {
          const trimmed = line.trim();

          // Empty line
          if (!trimmed) {
            flushList(`list-${segIdx}-${mIdx}-${lineIdx}`);
            return;
          }

          // Unordered list item: - or *
          const ulMatch = trimmed.match(/^[-*]\s+(.+)$/);
          if (ulMatch) {
            if (!currentList || currentList.type !== "ul") {
              flushList(`list-before-${segIdx}-${mIdx}-${lineIdx}`);
              currentList = { type: "ul", items: [ulMatch[1]] };
            } else {
              currentList.items.push(ulMatch[1]);
            }
            return;
          }

          // Ordered list item: 1. or 2.
          const olMatch = trimmed.match(/^\d+\.\s+(.+)$/);
          if (olMatch) {
            if (!currentList || currentList.type !== "ol") {
              flushList(`list-before-${segIdx}-${mIdx}-${lineIdx}`);
              currentList = { type: "ol", items: [olMatch[1]] };
            } else {
              currentList.items.push(olMatch[1]);
            }
            return;
          }

          // Not a list item, flush any active list
          flushList(`list-flush-${segIdx}-${mIdx}-${lineIdx}`);

          // Headings: #, ##, ###
          if (trimmed.startsWith("### ")) {
            blocks.push(
              <h3 key={`h3-${segIdx}-${mIdx}-${lineIdx}`} className="text-base font-bold text-white mt-3 mb-1">
                <InlineContent text={trimmed.slice(4)} />
              </h3>
            );
            return;
          }

          if (trimmed.startsWith("## ")) {
            blocks.push(
              <h2 key={`h2-${segIdx}-${mIdx}-${lineIdx}`} className="text-lg font-bold text-white mt-4 mb-1.5 pb-1 border-b border-neutral-800">
                <InlineContent text={trimmed.slice(3)} />
              </h2>
            );
            return;
          }

          if (trimmed.startsWith("# ")) {
            blocks.push(
              <h1 key={`h1-${segIdx}-${mIdx}-${lineIdx}`} className="text-xl font-extrabold text-white mt-4 mb-2 pb-1.5 border-b border-neutral-800">
                <InlineContent text={trimmed.slice(2)} />
              </h1>
            );
            return;
          }

          // Blockquote: >
          if (trimmed.startsWith("> ")) {
            blocks.push(
              <blockquote
                key={`quote-${segIdx}-${mIdx}-${lineIdx}`}
                className="my-2 pl-3 py-1 border-l-2 border-violet-500 text-neutral-300 italic bg-neutral-900/40 rounded-r-lg"
              >
                <InlineContent text={trimmed.slice(2)} />
              </blockquote>
            );
            return;
          }

          // Normal Paragraph
          blocks.push(
            <p key={`p-${segIdx}-${mIdx}-${lineIdx}`} className="my-1.5 leading-relaxed text-neutral-200">
              <InlineContent text={trimmed} />
            </p>
          );
        });

        flushList(`list-end-${segIdx}-${mIdx}`);
      });
    });

    return blocks;
  }, [content]);

  return <div className={`formatted-content text-sm space-y-1 ${className}`}>{renderedBlocks}</div>;
}
