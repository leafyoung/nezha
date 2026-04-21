import type { CSSProperties, ReactNode } from "react";
import { ChevronDown, FileCode } from "lucide-react";
import type { DiffFile, DiffRow, DiffViewMode } from "./types";
import { fileDir, fileName, lineMarker, rowTone } from "./parse";

const lineNumberStyle: CSSProperties = {
  color: "var(--text-hint)",
  textAlign: "right",
  padding: "0 10px",
  borderRight: "1px solid var(--border-dim)",
  userSelect: "none",
};

function UnifiedRow({ row }: { row: DiffRow }) {
  const tone = rowTone(row.type);
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "56px 56px 24px minmax(max-content, 1fr)",
        minHeight: 22,
        background: tone.bg,
        fontFamily: "var(--font-mono)",
        fontSize: 12.5,
        lineHeight: "22px",
      }}
    >
      <span style={lineNumberStyle}>{row.oldLine ?? ""}</span>
      <span style={lineNumberStyle}>{row.newLine ?? ""}</span>
      <span
        style={{
          color: tone.fg,
          background: tone.markerBg,
          textAlign: "center",
          userSelect: "none",
        }}
      >
        {lineMarker(row.type)}
      </span>
      <span style={{ color: tone.fg, whiteSpace: "pre", padding: "0 14px 0 8px" }}>
        {row.content || " "}
      </span>
    </div>
  );
}

function SplitCell({ row, side }: { row?: DiffRow; side: "old" | "new" }) {
  if (!row) {
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "56px 24px minmax(max-content, 1fr)",
          minHeight: 22,
          background: "var(--bg-panel)",
          opacity: 0.55,
        }}
      >
        <span style={lineNumberStyle} />
        <span />
        <span />
      </div>
    );
  }

  const tone = rowTone(row.type);
  const lineNumber = side === "old" ? row.oldLine : row.newLine;
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "56px 24px minmax(max-content, 1fr)",
        minHeight: 22,
        background: tone.bg,
        fontFamily: "var(--font-mono)",
        fontSize: 12.5,
        lineHeight: "22px",
      }}
    >
      <span style={lineNumberStyle}>{lineNumber ?? ""}</span>
      <span
        style={{
          color: tone.fg,
          background: tone.markerBg,
          textAlign: "center",
          userSelect: "none",
        }}
      >
        {lineMarker(row.type)}
      </span>
      <span style={{ color: tone.fg, whiteSpace: "pre", padding: "0 14px 0 8px" }}>
        {row.content || " "}
      </span>
    </div>
  );
}

function SplitRows({ rows }: { rows: DiffRow[] }) {
  const rendered: ReactNode[] = [];

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];

    if (row.type === "remove") {
      const removed: DiffRow[] = [];
      const added: DiffRow[] = [];
      while (rows[index]?.type === "remove") {
        removed.push(rows[index]);
        index += 1;
      }
      while (rows[index]?.type === "add") {
        added.push(rows[index]);
        index += 1;
      }
      index -= 1;
      const pairCount = Math.max(removed.length, added.length);
      for (let pairIndex = 0; pairIndex < pairCount; pairIndex += 1) {
        rendered.push(
          <SplitPair key={`pair-${index}-${pairIndex}`}>
            <SplitCell row={removed[pairIndex]} side="old" />
            <SplitCell row={added[pairIndex]} side="new" />
          </SplitPair>,
        );
      }
      continue;
    }

    if (row.type === "add") {
      rendered.push(
        <SplitPair key={`add-${index}`}>
          <SplitCell side="old" />
          <SplitCell row={row} side="new" />
        </SplitPair>,
      );
      continue;
    }

    if (row.type === "meta") {
      rendered.push(
        <div
          key={`meta-${index}`}
          style={{
            minHeight: 22,
            lineHeight: "22px",
            padding: "0 12px",
            color: "var(--text-hint)",
            fontFamily: "var(--font-mono)",
            fontSize: 12.5,
          }}
        >
          {row.content}
        </div>,
      );
      continue;
    }

    rendered.push(
      <SplitPair key={`context-${index}`}>
        <SplitCell row={row} side="old" />
        <SplitCell row={row} side="new" />
      </SplitPair>,
    );
  }

  return <>{rendered}</>;
}

function SplitPair({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(max-content, 1fr) minmax(max-content, 1fr)",
        minWidth: 920,
      }}
    >
      {children}
    </div>
  );
}

function HunkHeader({ header, split }: { header: string; split: boolean }) {
  return (
    <div
      style={{
        display: split ? "block" : "grid",
        gridTemplateColumns: split ? undefined : "56px 56px 24px minmax(max-content, 1fr)",
        minWidth: split ? 920 : undefined,
        minHeight: 24,
        lineHeight: "24px",
        background: "rgba(88, 166, 255, 0.08)",
        color: "var(--accent)",
        fontFamily: "var(--font-mono)",
        fontSize: 12,
        borderTop: "1px solid var(--border-dim)",
        borderBottom: "1px solid var(--border-dim)",
      }}
    >
      {split ? (
        <span style={{ padding: "0 12px" }}>{header}</span>
      ) : (
        <>
          <span />
          <span />
          <span />
          <span style={{ padding: "0 12px" }}>{header}</span>
        </>
      )}
    </div>
  );
}

export function DiffFileBlock({ file, viewMode }: { file: DiffFile; viewMode: DiffViewMode }) {
  const dir = fileDir(file.displayPath);
  const name = fileName(file.displayPath);
  const isSplit = viewMode === "split";

  return (
    <div
      style={{
        border: "1px solid var(--border-dim)",
        borderRadius: 9,
        overflow: "hidden",
        background: "var(--bg-panel)",
        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
      }}
    >
      <div
        style={{
          height: 38,
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "0 12px",
          background: "var(--bg-card)",
          borderBottom: "1px solid var(--border-dim)",
        }}
      >
        <ChevronDown size={14} color="var(--text-hint)" />
        <FileCode size={14} color="var(--accent)" />
        <span style={{ fontSize: 13, fontWeight: 650, color: "var(--text-primary)" }}>
          {name}
        </span>
        {dir && <span style={{ fontSize: 12, color: "var(--text-hint)" }}>{dir}/</span>}
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 12, color: "#2f8f46", fontWeight: 650 }}>+{file.additions}</span>
        <span style={{ fontSize: 12, color: "#c93f39", fontWeight: 650 }}>-{file.deletions}</span>
        <span
          style={{
            padding: "2px 8px",
            borderRadius: 6,
            background: "rgba(214, 150, 32, 0.14)",
            color: "#a46a0a",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 0.2,
          }}
        >
          Modified
        </span>
      </div>

      <div style={{ overflowX: "auto" }}>
        {file.hunks.length === 0 ? (
          <div
            style={{
              padding: "12px 14px",
              color: "var(--text-hint)",
              fontSize: 12.5,
              fontFamily: "var(--font-mono)",
            }}
          >
            {file.meta.join("\n") || "No textual changes"}
          </div>
        ) : (
          file.hunks.map((hunk, index) => (
            <div key={`${hunk.header}-${index}`}>
              <HunkHeader header={hunk.header} split={isSplit} />
              {isSplit ? (
                <SplitRows rows={hunk.rows} />
              ) : (
                hunk.rows.map((row, rowIndex) => (
                  <UnifiedRow key={`${index}-${rowIndex}`} row={row} />
                ))
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
