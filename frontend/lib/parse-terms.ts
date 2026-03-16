/**
 * Parse CommonPaper markdown template into clean sections for rendering.
 * Strips HTML span annotations and extracts numbered sections with their content.
 */

export interface TermSection {
  number: string;
  title: string;
  content: string;
}

export function parseTerms(markdown: string): TermSection[] {
  // Strip all HTML tags
  const clean = markdown.replace(/<[^>]+>/g, "");

  const sections: TermSection[] = [];
  // Match top-level numbered sections: "1. Title" or "# Title" at start of line
  const lines = clean.split("\n");
  let currentSection: TermSection | null = null;
  let contentLines: string[] = [];

  for (const line of lines) {
    // Match "1. Title" pattern (top-level section)
    const sectionMatch = line.match(/^(\d+)\.\s+(.+)/);
    if (sectionMatch) {
      if (currentSection) {
        currentSection.content = contentLines.join("\n").trim();
        sections.push(currentSection);
      }
      currentSection = {
        number: sectionMatch[1],
        title: sectionMatch[2].trim(),
        content: "",
      };
      contentLines = [];
      continue;
    }

    // Skip the markdown title line (# Document Name)
    if (line.startsWith("# ")) continue;

    if (currentSection) {
      contentLines.push(line);
    }
  }

  if (currentSection) {
    currentSection.content = contentLines.join("\n").trim();
    sections.push(currentSection);
  }

  return sections;
}

/** Strip HTML tags from a string. */
export function stripHtml(text: string): string {
  return text.replace(/<[^>]+>/g, "");
}
