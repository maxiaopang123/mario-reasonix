import { useEffect, useRef, useState } from "react";
import { Download } from "lucide-react";
import mermaid from "mermaid";
import { CopyButton } from "./CopyButton";
import { SaveAssetToWorkspace } from "../../wailsjs/go/main/App";

// Initialize mermaid once (idempotent). Guarded so HMR / Strict Mode
// double-invoke won't re-run init with conflicting settings.
let initialized = false;
function ensureInit() {
  if (initialized) return;
  mermaid.initialize({
    startOnLoad: false,
    theme: "default",
    securityLevel: "loose",
    fontFamily: "inherit",
  });
  initialized = true;
}

let idSeq = 0;

type ViewMode = "preview" | "source";

/** Ensure the SVG string has an xmlns so it can be loaded as a standalone image. */
function ensureXmlns(svg: string): string {
  if (/xmlns=/.test(svg)) return svg;
  return svg.replace(/<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
}

/**
 * Renders a mermaid code block with a toolbar:
 *  - language label (top-left)
 *  - preview / source toggle
 *  - copy source + download SVG / PNG (via native save dialog)
 *
 * Falls back to showing the raw source + error when rendering fails,
 * so users always see something useful instead of a blank hole.
 */
export default function MermaidDiagram({ chart }: { chart: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [mode, setMode] = useState<ViewMode>("preview");
  const [busy, setBusy] = useState<"" | "svg" | "png">("");

  useEffect(() => {
    let cancelled = false;
    ensureInit();
    const id = `mermaid-${++idSeq}`;
    (async () => {
      try {
        const { svg } = await mermaid.render(id, chart);
        if (!cancelled) {
          setSvg(svg);
          setError("");
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
          setSvg("");
          document.getElementById(id)?.remove();
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [chart]);

  const baseName = `mermaid-${Date.now()}`;
  const [savedPath, setSavedPath] = useState<string>("");

  const handleDownloadSvg = async () => {
    if (!svg || busy) return;
    setBusy("svg");
    setSavedPath("");
    try {
      const path = await SaveAssetToWorkspace(
        `${baseName}.svg`,
        ensureXmlns(svg),
        false
      );
      setSavedPath(path);
    } catch (e) {
      setError(e instanceof Error ? `保存失败: ${e.message}` : `保存失败: ${e}`);
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="md-mermaid-block">
      <div className="md-mermaid-block__toolbar">
        <span className="md-mermaid-block__label">
          {error ? "Mermaid ⚠" : "Mermaid"}
        </span>
        <div className="md-mermaid-block__actions">
          <div className="md-mermaid-block__toggle" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={mode === "preview"}
              className={
                "md-mermaid-block__tab" +
                (mode === "preview" ? " is-active" : "")
              }
              onClick={() => setMode("preview")}
              disabled={!!error}
              title={error ? "渲染失败，无法预览" : "预览渲染图"}
            >
              预览
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "source"}
              className={
                "md-mermaid-block__tab" +
                (mode === "source" ? " is-active" : "")
              }
              onClick={() => setMode("source")}
              title="查看源代码"
            >
              源码
            </button>
          </div>
          <CopyButton
            text={chart}
            label="源码"
            className="md-mermaid-block__copy md-mermaid-block__copy--labeled"
            showInlineLabel
          />
          {svg && (
            <button
              type="button"
              className="md-mermaid-block__download"
              onClick={handleDownloadSvg}
              disabled={!!busy}
              title="保存 SVG 到当前工作区"
            >
              <Download size={13} />
              <span>{busy === "svg" ? "..." : "SVG"}</span>
            </button>
          )}
        </div>
      </div>

      <div className="md-mermaid-block__body">
        {mode === "preview" ? (
          svg ? (
            <div
              ref={hostRef}
              className="md-mermaid-block__svg"
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          ) : error ? (
            <pre className="md-mermaid-block__source">
              <code>{chart}</code>
              <span className="md-mermaid-block__error">
                {"\n\n"}
                ⚠ {error}
              </span>
            </pre>
          ) : (
            <div className="md-mermaid-block__loading">渲染中…</div>
          )
        ) : (
          <pre className="md-mermaid-block__source">
            <code>{chart}</code>
            {error && (
              <span className="md-mermaid-block__error">
                {"\n\n"}
                ⚠ {error}
              </span>
            )}
          </pre>
        )}
      </div>

      {savedPath && (
        <div className="md-mermaid-block__saved" title={savedPath}>
          ✓ 已保存到工作区：{savedPath}
        </div>
      )}
    </div>
  );
}

