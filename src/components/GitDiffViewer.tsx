import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Columns2, FileCode, Rows3, X } from "lucide-react";
import { DiffFileBlock } from "./git-diff/DiffFileBlock";
import { parseDiff, plural } from "./git-diff/parse";
import type { DiffViewMode } from "./git-diff/types";

interface Props {
  projectPath: string;
  // "commit" = full commit diff, "file" = working-tree file diff, "commit-file" = single file in a commit
  mode: "commit" | "file" | "commit-file";
  commitHash?: string;
  filePath?: string;
  staged?: boolean;
  title: string;
  onClose: () => void;
}

function DiffToolbarButton({
  active,
  title,
  onClick,
  children,
}: {
  active: boolean;
  title: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 28,
        height: 28,
        border: "none",
        borderRadius: 6,
        background: active ? "var(--bg-hover)" : "transparent",
        color: active ? "var(--accent)" : "var(--text-hint)",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {children}
    </button>
  );
}

export function GitDiffViewer({
  projectPath,
  mode,
  commitHash,
  filePath,
  staged,
  title,
  onClose,
}: Props) {
  const [diff, setDiff] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<DiffViewMode>("unified");

  useEffect(() => {
    setLoading(true);
    setError(null);

    const load = async () => {
      try {
        let result: string;
        if (mode === "commit" && commitHash) {
          result = await invoke<string>("git_show_diff", { projectPath, commitHash });
        } else if (mode === "commit-file" && commitHash && filePath !== undefined) {
          result = await invoke<string>("git_show_file_diff", {
            projectPath,
            commitHash,
            filePath,
          });
        } else if (mode === "file" && filePath !== undefined) {
          result = await invoke<string>("git_file_diff", {
            projectPath,
            filePath,
            staged: staged ?? false,
          });
        } else {
          result = "";
        }
        setDiff(result);
      } catch (e) {
        setError(String(e));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [projectPath, mode, commitHash, filePath, staged]);

  const parsedFiles = useMemo(() => parseDiff(diff, projectPath), [diff, projectPath]);
  const totalAdditions = parsedFiles.reduce((sum, file) => sum + file.additions, 0);
  const totalDeletions = parsedFiles.reduce((sum, file) => sum + file.deletions, 0);

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: "var(--bg-panel)",
      }}
    >
      <div
        style={{
          minHeight: 50,
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "0 14px",
          borderBottom: "1px solid var(--border-dim)",
          flexShrink: 0,
          background: "var(--bg-panel)",
        }}
      >
        <FileCode size={15} color="var(--accent)" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 13.5,
              fontWeight: 700,
              color: "var(--text-primary)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {title}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 2,
              fontSize: 12,
              color: "var(--text-hint)",
            }}
          >
            <span>{plural(parsedFiles.length, "changed file")}</span>
            <span style={{ color: "#2f8f46", fontWeight: 650 }}>+{totalAdditions}</span>
            <span style={{ color: "#c93f39", fontWeight: 650 }}>-{totalDeletions}</span>
          </div>
        </div>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 2,
            padding: 2,
            border: "1px solid var(--border-dim)",
            borderRadius: 8,
            background: "var(--bg-card)",
          }}
        >
          <DiffToolbarButton
            active={viewMode === "unified"}
            title="Single column diff"
            onClick={() => setViewMode("unified")}
          >
            <Rows3 size={15} />
          </DiffToolbarButton>
          <DiffToolbarButton
            active={viewMode === "split"}
            title="Two column diff"
            onClick={() => setViewMode("split")}
          >
            <Columns2 size={15} />
          </DiffToolbarButton>
        </div>

        <button
          onClick={onClose}
          title="Close diff"
          style={{
            width: 28,
            height: 28,
            background: "transparent",
            border: "none",
            cursor: "pointer",
            borderRadius: 6,
            color: "var(--text-hint)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <X size={15} />
        </button>
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: 14 }}>
        {loading ? (
          <div
            style={{ padding: 24, color: "var(--text-hint)", fontSize: 13, textAlign: "center" }}
          >
            Loading diff…
          </div>
        ) : error ? (
          <div style={{ padding: 24, color: "var(--danger)", fontSize: 13 }}>{error}</div>
        ) : diff.trim() === "" ? (
          <div
            style={{ padding: 24, color: "var(--text-hint)", fontSize: 13, textAlign: "center" }}
          >
            No changes
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: "100%" }}>
            {parsedFiles.map((file, index) => (
              <DiffFileBlock
                key={`${file.displayPath}-${index}`}
                file={file}
                viewMode={viewMode}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
