"use client";

import { useMemo } from "react";

type ScrollActivatedTextProps = {
  text: string;
  startIndex: number;
  activeWordCount: number;
  wordClassName?: string;
  inactiveClassName?: string;
  activeClassName?: string;
};

function splitWords(text: string) {
  return text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0);
}

export function countWords(text: string) {
  return splitWords(text).length;
}

export function ScrollActivatedText({
  text,
  startIndex,
  activeWordCount,
  wordClassName = "",
  inactiveClassName = "font-normal text-muted/65",
  activeClassName = "font-medium text-foreground/95",
}: ScrollActivatedTextProps) {
  const words = useMemo(() => splitWords(text), [text]);

  if (words.length === 0) return null;

  return (
    <>
      {words.map((word, localIndex) => {
        const globalIndex = startIndex + localIndex;
        const isActive = globalIndex < activeWordCount;

        return (
          <span
            key={`${globalIndex}-${word}`}
            className={`transition-[color,font-weight,opacity] duration-300 ${wordClassName} ${isActive ? activeClassName : inactiveClassName}`}
          >
            {word}
            {localIndex < words.length - 1 ? " " : ""}
          </span>
        );
      })}
    </>
  );
}

