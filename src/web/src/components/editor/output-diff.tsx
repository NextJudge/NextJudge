"use client";

import { Card } from "@/components/ui/card";
import { useMemo, type ReactNode } from "react";

type SegmentKind = "match" | "missing" | "extra";

interface AlignedSegment {
  text: string;
  kind: SegmentKind;
}

function groupSegments(
  text: string,
  getKind: (index: number) => SegmentKind
): AlignedSegment[] {
  if (text.length === 0) return [];

  const segments: AlignedSegment[] = [];
  let buffer = "";
  let currentKind = getKind(0);

  const flush = () => {
    if (buffer.length > 0) {
      segments.push({ text: buffer, kind: currentKind });
      buffer = "";
    }
  };

  for (let i = 0; i < text.length; i++) {
    const kind = getKind(i);
    if (kind !== currentKind) {
      flush();
      currentKind = kind;
    }
    buffer += text[i];
  }

  flush();
  return segments;
}

function buildExpectedSegments(expected: string, actual: string): AlignedSegment[] {
  return groupSegments(expected, (index) => {
    if (index < actual.length && expected[index] === actual[index]) {
      return "match";
    }
    return "missing";
  });
}

function buildActualSegments(expected: string, actual: string): AlignedSegment[] {
  return groupSegments(actual, (index) => {
    if (index < expected.length && expected[index] === actual[index]) {
      return "match";
    }
    return "extra";
  });
}

function buildLineAlignedSegments(
  expected: string,
  actual: string,
  side: "expected" | "actual"
): AlignedSegment[] {
  const expectedLines = expected.split("\n");
  const actualLines = actual.split("\n");
  const lineCount = Math.max(expectedLines.length, actualLines.length);
  const segments: AlignedSegment[] = [];

  for (let line = 0; line < lineCount; line++) {
    if (line > 0) {
      segments.push({ text: "\n", kind: "match" });
    }

    const expectedLine = expectedLines[line] ?? "";
    const actualLine = actualLines[line] ?? "";
    const lineSegments =
      side === "expected"
        ? buildExpectedSegments(expectedLine, actualLine)
        : buildActualSegments(expectedLine, actualLine);

    segments.push(...lineSegments);
  }

  return segments;
}

function computeAlignedSegments(
  expected: string,
  actual: string,
  side: "expected" | "actual"
): AlignedSegment[] {
  if (expected.includes("\n") || actual.includes("\n")) {
    return buildLineAlignedSegments(expected, actual, side);
  }

  return side === "expected"
    ? buildExpectedSegments(expected, actual)
    : buildActualSegments(expected, actual);
}

function DiffCard({ children }: { children: ReactNode }) {
  return (
    <Card className="overflow-hidden border border-border/50 bg-muted/30">
      <div className="px-3 py-3 font-mono whitespace-pre-wrap break-all leading-6 text-foreground select-all">
        {children}
      </div>
    </Card>
  );
}

function ExpectedDiffView({ segments }: { segments: AlignedSegment[] }) {
  return (
    <>
      {segments.map((segment, index) => {
        if (segment.kind === "missing") {
          return (
            <span
              key={index}
              className="text-destructive line-through decoration-destructive/80 bg-destructive/15"
            >
              {segment.text}
            </span>
          );
        }
        return <span key={index}>{segment.text}</span>;
      })}
    </>
  );
}

function ActualDiffView({ segments }: { segments: AlignedSegment[] }) {
  return (
    <>
      {segments.map((segment, index) => {
        if (segment.kind === "extra") {
          return (
            <span key={index} className="text-destructive bg-destructive/15">
              {segment.text}
            </span>
          );
        }
        return <span key={index}>{segment.text}</span>;
      })}
    </>
  );
}

export function OutputComparison({
  expected,
  actual,
}: {
  expected: string;
  actual: string;
}) {
  const expectedSegments = useMemo(
    () => computeAlignedSegments(expected, actual, "expected"),
    [expected, actual]
  );
  const actualSegments = useMemo(
    () => computeAlignedSegments(expected, actual, "actual"),
    [expected, actual]
  );

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <p className="text-xs text-muted-foreground">Expected Output</p>
        <DiffCard>
          <ExpectedDiffView segments={expectedSegments} />
        </DiffCard>
      </div>
      <div className="space-y-1.5">
        <p className="text-xs text-muted-foreground">Your Output</p>
        <DiffCard>
          <ActualDiffView segments={actualSegments} />
        </DiffCard>
      </div>
    </div>
  );
}
