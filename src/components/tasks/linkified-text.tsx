import { Fragment } from "react";

// Matches http(s):// URLs and bare www. links, stopping before trailing
// punctuation that is usually sentence punctuation, not part of the URL.
const URL_PATTERN = /((?:https?:\/\/|www\.)[^\s<]+[^\s<.,!?;:)\]}'"])/gi;

/**
 * Renders plain text with any URLs turned into clickable links. Text is kept
 * as-is (React escapes it); only recognized URLs become anchors.
 */
export function LinkifiedText({ text }: { text: string }) {
  const parts = text.split(URL_PATTERN);
  return (
    <>
      {parts.map((part, i) => {
        if (i % 2 === 1) {
          const href = part.startsWith("www.") ? `https://${part}` : part;
          return (
            <a
              key={i}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              // Following a link must not trigger an enclosing click handler
              // (e.g. switching the description into edit mode).
              onClick={(e) => e.stopPropagation()}
              className="text-primary underline underline-offset-2 hover:no-underline break-words"
            >
              {part}
            </a>
          );
        }
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}
