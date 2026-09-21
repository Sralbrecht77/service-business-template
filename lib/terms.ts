import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

export type TermsBlock =
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] };

export type TermsSection = {
  number: number;
  heading: string;
  blocks: TermsBlock[];
};

export type TermsDocument = {
  title: string;
  companyName: string;
  lastUpdated: string;
  introduction: TermsBlock[];
  sections: TermsSection[];
};

function appendBlock(blocks: TermsBlock[], type: "paragraph" | "bullet", text: string) {
  const normalizedText = text.replace(/\s+/g, " ").trim();
  if (!normalizedText) return;

  if (type === "bullet") {
    const previous = blocks.at(-1);
    if (previous?.type === "list") {
      previous.items.push(normalizedText);
    } else {
      blocks.push({ type: "list", items: [normalizedText] });
    }
    return;
  }

  blocks.push({ type: "paragraph", text: normalizedText });
}

export async function getTermsDocument(): Promise<TermsDocument> {
  const sourcePath = path.join(
    process.cwd(),
    "docs",
    "guidestone-terms-source.txt",
  );
  const source = await readFile(sourcePath, "utf8");
  const lines = source.replace(/\r\n?/g, "\n").replace(/\f/g, "\n").split("\n");

  const header: string[] = [];
  let cursor = 0;
  while (cursor < lines.length && header.length < 3) {
    const line = lines[cursor].trim();
    cursor += 1;
    if (line) header.push(line);
  }

  if (header.length !== 3) {
    throw new Error("The Terms & Conditions source is missing its required header.");
  }

  const introduction: TermsBlock[] = [];
  const sections: TermsSection[] = [];
  let activeBlocks = introduction;
  let pendingLines: string[] = [];
  let pendingType: "paragraph" | "bullet" = "paragraph";

  const flushPending = () => {
    appendBlock(activeBlocks, pendingType, pendingLines.join(" "));
    pendingLines = [];
    pendingType = "paragraph";
  };

  for (; cursor < lines.length; cursor += 1) {
    const line = lines[cursor].trim();
    const sectionMatch = line.match(/^(\d+)\.\s+(.+)$/);

    if (sectionMatch) {
      flushPending();
      const section: TermsSection = {
        number: Number(sectionMatch[1]),
        heading: line,
        blocks: [],
      };
      sections.push(section);
      activeBlocks = section.blocks;
      continue;
    }

    if (!line) {
      flushPending();
      continue;
    }

    const bulletMatch = line.match(/^•\s*(.+)$/);
    if (bulletMatch) {
      flushPending();
      pendingType = "bullet";
      pendingLines = [bulletMatch[1]];
      continue;
    }

    pendingLines.push(line);
  }

  flushPending();

  return {
    title: header[0],
    companyName: header[1],
    lastUpdated: header[2],
    introduction,
    sections,
  };
}
