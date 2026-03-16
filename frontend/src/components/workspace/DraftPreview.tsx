import type { Citation } from '../../types';
import { Tooltip } from '../shared/Tooltip';

interface CitationMatch {
  citation: Citation;
  start: number;
  end: number;
}

interface NormalizedText {
  text: string;
  indexMap: number[];
}

function normalizeForMatching(input: string): NormalizedText {
  const chars: string[] = [];
  const indexMap: number[] = [];
  let previousWasSpace = true;

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    const lowerCharacter = character.toLowerCase();
    const isWordCharacter = /[a-z0-9]/.test(lowerCharacter);

    if (isWordCharacter) {
      chars.push(lowerCharacter);
      indexMap.push(index);
      previousWasSpace = false;
      continue;
    }

    if (!previousWasSpace) {
      chars.push(' ');
      indexMap.push(index);
      previousWasSpace = true;
    }
  }

  if (chars.length > 0 && chars[chars.length - 1] === ' ') {
    chars.pop();
    indexMap.pop();
  }

  return {
    text: chars.join(''),
    indexMap,
  };
}

function findExactOrNormalizedMatch(
  text: string,
  quote: string,
  existingMatches: CitationMatch[],
): { start: number; end: number } | null {
  let searchFrom = 0;
  while (searchFrom < text.length) {
    const start = text.indexOf(quote, searchFrom);
    if (start === -1) {
      break;
    }

    const end = start + quote.length;
    const overlaps = existingMatches.some((match) => start < match.end && end > match.start);
    if (!overlaps) {
      return { start, end };
    }

    searchFrom = start + quote.length;
  }

  const normalizedText = normalizeForMatching(text);
  const normalizedQuote = normalizeForMatching(quote).text;

  if (!normalizedQuote) {
    return null;
  }

  const normalizedStart = normalizedText.text.indexOf(normalizedQuote);
  if (normalizedStart === -1) {
    return null;
  }

  const normalizedEnd = normalizedStart + normalizedQuote.length - 1;
  const start = normalizedText.indexMap[normalizedStart];
  const end = normalizedText.indexMap[normalizedEnd] + 1;

  const overlaps = existingMatches.some((match) => start < match.end && end > match.start);
  if (overlaps) {
    return null;
  }

  return { start, end };
}

function getCitationMatches(text: string, citations: Citation[]): CitationMatch[] {
  const matches: CitationMatch[] = [];

  for (const citation of citations) {
    const quote = citation.exact_quote.trim();
    if (!quote) {
      continue;
    }

    const match = findExactOrNormalizedMatch(text, quote, matches);
    if (match) {
      matches.push({ citation, start: match.start, end: match.end });
    }
  }

  return matches.sort((a, b) => a.start - b.start);
}

interface DraftPreviewProps {
  text: string;
  citations: Citation[];
  onEdit: () => void;
}

export function DraftPreview({ text, citations, onEdit }: DraftPreviewProps) {
  const matches = getCitationMatches(text, citations);

  if (matches.length === 0) {
    return (
      <button
        type="button"
        onClick={onEdit}
        className="w-full text-left bg-white p-5 rounded-lg border border-gray-300 whitespace-pre-wrap text-sm text-gray-800 hover:border-blue-400 hover:shadow-md transition-all shadow-sm leading-relaxed"
      >
        {text || 'No draft yet.'}
      </button>
    );
  }

  const parts: Array<{ key: string; text: string; citation?: Citation }> = [];
  let cursor = 0;

  for (const match of matches) {
    if (match.start > cursor) {
      parts.push({
        key: `text-${cursor}`,
        text: text.slice(cursor, match.start),
      });
    }

    parts.push({
      key: `citation-${match.start}-${match.end}`,
      text: text.slice(match.start, match.end),
      citation: match.citation,
    });
    cursor = match.end;
  }

  if (cursor < text.length) {
    parts.push({
      key: `text-${cursor}`,
      text: text.slice(cursor),
    });
  }

  return (
    <button
      type="button"
      onClick={onEdit}
      className="w-full text-left bg-white p-5 rounded-lg border border-gray-300 whitespace-pre-wrap text-sm text-gray-800 hover:border-blue-400 hover:shadow-md transition-all shadow-sm leading-relaxed"
    >
      {parts.map((part) =>
        part.citation ? (
          <Tooltip
            key={part.key}
            position="top"
            content={
              <>
                <span className="block font-semibold text-gray-900 mb-1">Source:</span>
                <span className="block">{part.citation.source_fact}</span>
              </>
            }
          >
            <mark className="rounded bg-yellow-100 px-0.5 text-inherit underline decoration-dotted underline-offset-2 cursor-help">
              {part.text}
            </mark>
          </Tooltip>
        ) : (
          <span key={part.key}>{part.text}</span>
        )
      )}
    </button>
  );
}
