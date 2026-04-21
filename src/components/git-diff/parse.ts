import type { DiffFile, DiffHunk, DiffLineType } from "./types";

export function cleanDiffPath(path: string, projectPath?: string): string {
  const trimmed = path.trim();
  if (trimmed === "/dev/null") return trimmed;
  const withoutPrefix = trimmed.replace(/^a\//, "").replace(/^b\//, "");
  if (projectPath && withoutPrefix.startsWith(`${projectPath}/`)) {
    return withoutPrefix.slice(projectPath.length + 1);
  }
  return withoutPrefix;
}

export function fileName(path: string): string {
  return path.split("/").pop() ?? path;
}

export function fileDir(path: string): string {
  const parts = path.split("/");
  return parts.length > 1 ? parts.slice(0, -1).join("/") : "";
}

export function plural(count: number, singular: string, pluralLabel = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : pluralLabel}`;
}

export function parseDiff(diff: string, projectPath?: string): DiffFile[] {
  const files: DiffFile[] = [];
  const lines = diff.replace(/\r\n/g, "\n").split("\n");
  let currentFile: DiffFile | null = null;
  let currentHunk: DiffHunk | null = null;
  let oldLine = 0;
  let newLine = 0;

  const createFile = (line: string): DiffFile => {
    const match = /^diff --git\s+(.+?)\s+(.+)$/.exec(line);
    const oldPath = match ? cleanDiffPath(match[1], projectPath) : "";
    const newPath = match ? cleanDiffPath(match[2], projectPath) : "";
    return {
      oldPath,
      newPath,
      displayPath: newPath || oldPath || "Changed file",
      hunks: [],
      meta: [],
      additions: 0,
      deletions: 0,
    };
  };

  for (const line of lines) {
    if (line.startsWith("diff --git")) {
      currentFile = createFile(line);
      currentHunk = null;
      files.push(currentFile);
      continue;
    }

    if (!currentFile) {
      if (!line.trim()) continue;
      currentFile = createFile("diff --git  ");
      currentHunk = null;
      files.push(currentFile);
    }

    if (line.startsWith("--- ")) {
      currentFile.oldPath = cleanDiffPath(line.slice(4), projectPath);
      if (!currentFile.newPath) currentFile.displayPath = currentFile.oldPath;
      currentFile.meta.push(line);
      continue;
    }

    if (line.startsWith("+++ ")) {
      currentFile.newPath = cleanDiffPath(line.slice(4), projectPath);
      currentFile.displayPath =
        currentFile.newPath !== "/dev/null" ? currentFile.newPath : currentFile.oldPath;
      currentFile.meta.push(line);
      continue;
    }

    if (line.startsWith("@@")) {
      currentHunk = { header: line, rows: [] };
      currentFile.hunks.push(currentHunk);
      const match = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(line);
      oldLine = match ? Number(match[1]) : 0;
      newLine = match ? Number(match[2]) : 0;
      continue;
    }

    if (!currentHunk) {
      if (line.trim()) currentFile.meta.push(line);
      continue;
    }

    if (line.startsWith("+")) {
      currentHunk.rows.push({ type: "add", content: line.slice(1), newLine });
      currentFile.additions += 1;
      newLine += 1;
    } else if (line.startsWith("-")) {
      currentHunk.rows.push({ type: "remove", content: line.slice(1), oldLine });
      currentFile.deletions += 1;
      oldLine += 1;
    } else if (line.startsWith(" ")) {
      currentHunk.rows.push({ type: "context", content: line.slice(1), oldLine, newLine });
      oldLine += 1;
      newLine += 1;
    } else if (line.startsWith("\\")) {
      currentHunk.rows.push({ type: "meta", content: line });
    } else if (line.trim()) {
      currentHunk.rows.push({ type: "meta", content: line });
    }
  }

  return files.filter((file) => file.hunks.length > 0 || file.meta.length > 0);
}

export function rowTone(type: DiffLineType) {
  if (type === "add") {
    return {
      bg: "rgba(46, 160, 67, 0.12)",
      markerBg: "rgba(46, 160, 67, 0.18)",
      fg: "#2f8f46",
    };
  }
  if (type === "remove") {
    return {
      bg: "rgba(248, 81, 73, 0.12)",
      markerBg: "rgba(248, 81, 73, 0.18)",
      fg: "#c93f39",
    };
  }
  if (type === "meta") {
    return {
      bg: "transparent",
      markerBg: "transparent",
      fg: "var(--text-hint)",
    };
  }
  return {
    bg: "transparent",
    markerBg: "transparent",
    fg: "var(--text-primary)",
  };
}

export function lineMarker(type: DiffLineType): string {
  if (type === "add") return "+";
  if (type === "remove") return "-";
  return " ";
}
