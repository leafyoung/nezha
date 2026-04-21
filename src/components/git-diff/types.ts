export type DiffViewMode = "unified" | "split";
export type DiffLineType = "context" | "add" | "remove" | "meta";

export interface DiffRow {
  type: DiffLineType;
  content: string;
  oldLine?: number;
  newLine?: number;
}

export interface DiffHunk {
  header: string;
  rows: DiffRow[];
}

export interface DiffFile {
  oldPath: string;
  newPath: string;
  displayPath: string;
  hunks: DiffHunk[];
  meta: string[];
  additions: number;
  deletions: number;
}
