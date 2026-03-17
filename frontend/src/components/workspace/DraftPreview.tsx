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

interface TextSegment {
  start: number;
  end: number;
  text: string;
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

function getMatchTokens(input: string): string[] {
  return normalizeForMatching(input)
    .text
    .split(' ')
    .filter(Boolean);
}

function trimSegment(text: string, start: number, end: number): TextSegment | null {
  let trimmedStart = start;
  let trimmedEnd = end;

  while (trimmedStart < trimmedEnd && /\s/.test(text[trimmedStart])) {
    trimmedStart += 1;
  }

  while (trimmedEnd > trimmedStart && /\s/.test(text[trimmedEnd - 1])) {
    trimmedEnd -= 1;
  }

  if (trimmedStart >= trimmedEnd) {
    return null;
  }

  return {
    start: trimmedStart,
    end: trimmedEnd,
    text: text.slice(trimmedStart, trimmedEnd),
  };
}

function getCandidateSegments(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  let lineStart = 0;

  for (let index = 0; index <= text.length; index += 1) {
    const isLineBoundary = index === text.length || text[index] === '\n';
    if (!isLineBoundary) {
      continue;
    }

    const lineEnd = index;
    const trimmedLine = trimSegment(text, lineStart, lineEnd);
    if (trimmedLine) {
      segments.push(trimmedLine);

      const sentenceRegex = /[^.!?\n]+[.!?]?/g;
      for (const match of trimmedLine.text.matchAll(sentenceRegex)) {
        const sentenceStart = trimmedLine.start + match.index!;
        const sentenceEnd = sentenceStart + match[0].length;
        const trimmedSentence = trimSegment(text, sentenceStart, sentenceEnd);
        if (trimmedSentence) {
          segments.push(trimmedSentence);
        }
      }
    }

    lineStart = index + 1;
  }

  return segments;
}

function findSegmentFallbackMatch(
  text: string,
  quote: string,
  existingMatches: CitationMatch[],
): { start: number; end: number } | null {
  const quoteTokens = Array.from(new Set(getMatchTokens(quote)));
  if (quoteTokens.length < 2) {
    return null;
  }

  let bestMatch: { start: number; end: number; score: number } | null = null;

  for (const segment of getCandidateSegments(text)) {
    const overlaps = existingMatches.some((match) => segment.start < match.end && segment.end > match.start);
    if (overlaps) {
      continue;
    }

    const segmentTokens = new Set(getMatchTokens(segment.text));
    if (segmentTokens.size === 0) {
      continue;
    }

    const sharedTokens = quoteTokens.filter((token) => segmentTokens.has(token));
    const coverage = sharedTokens.length / quoteTokens.length;
    const hasNumber = quoteTokens.some((token) => /\d/.test(token));
    const sharedNumberCount = sharedTokens.filter((token) => /\d/.test(token)).length;

    if (sharedTokens.length < 2 || coverage < 0.5 || (hasNumber && sharedNumberCount === 0)) {
      continue;
    }

    const score = coverage * 100 + sharedTokens.length - segment.text.length / 1000;
    if (!bestMatch || score > bestMatch.score) {
      bestMatch = {
        start: segment.start,
        end: segment.end,
        score,
      };
    }
  }

  if (!bestMatch) {
    return null;
  }

  return { start: bestMatch.start, end: bestMatch.end };
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
    return findSegmentFallbackMatch(text, quote, existingMatches);
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
