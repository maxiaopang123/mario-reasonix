import { useCallback, useEffect, useRef, useState } from "react";
import { Eye, Code2, MousePointerClick, X, Maximize2, Minimize2 } from "lucide-react";
import { Tooltip } from "./Tooltip";
import { CodeViewer } from "./CodeViewer";
import MarkdownRenderer from "./MarkdownRenderer";
import { app } from "../lib/bridge";
import type { FilePreview } from "../lib/types";

// Element picker script for HTML preview — injected via iframe eval.
const PICKER_SCRIPT = `
(function(){
  if (window.__reasonixPickerActive) { window.__reasonixPickerActive = !window.__reasonixPickerActive; return; }
  window.__reasonixPickerActive = true;
  var overlay = document.createElement('div');
  overlay.id = '__reasonix_picker_highlight';
  overlay.style.cssText = 'position:fixed;pointer-events:none;z-index:2147483647;border:2px solid #4f9cff;background:rgba(79,156,255,0.12);transition:all 60ms ease;display:none;';
  document.body.appendChild(overlay);
  function position(el){ var r=el.getBoundingClientRect(); overlay.style.display='block'; overlay.style.left=r.left+'px'; overlay.style.top=r.top+'px'; overlay.style.width=r.width+'px'; overlay.style.height=r.height+'px'; }
  function onMove(e){ if(!window.__reasonixPickerActive) return; var el=document.elementFromPoint(e.clientX,e.clientY); if(!el||el===overlay||el.id==='__reasonix_picker_highlight') return; position(el); }
  function onKey(e){ if(e.key==='Escape') cleanup(); }
  function onClick(e){ if(!window.__reasonixPickerActive) return; e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); var el=document.elementFromPoint(e.clientX,e.clientY); if(!el||el.id==='__reasonix_picker_highlight') return; parent.postMessage({__reasonixPicker:true,html:el.outerHTML,tag:el.tagName.toLowerCase()],'*'); }
  function cleanup(){ window.__reasonixPickerActive=false; document.removeEventListener('mousemove',onMove,true); document.removeEventListener('click',onClick,true); document.removeEventListener('keydown',onKey,true); var o=document.getElementById('__reasonix_picker_highlight'); if(o) o.remove(); }
  document.addEventListener('mousemove',onMove,true); document.addEventListener('click',onClick,true); document.addEventListener('keydown',onKey,true);
})();
`;

function basename(path: string): string {
  const clean = path.replace(/[\\/]+$/, "");
  return clean.split(/[\\/]/).filter(Boolean).pop() ?? path;
}

function languageFor(path: string): string | undefined {
  const ext = path.split(".").pop()?.toLowerCase();
  const map: Record<string, string> = {
    ts: "typescript", tsx: "tsx", js: "javascript", jsx: "jsx",
    py: "python", go: "go", rs: "rust", java: "java", c: "c", cpp: "cpp",
    cs: "csharp", rb: "ruby", php: "php", swift: "swift", kt: "kotlin",
    html: "html", htm: "html", css: "css", scss: "scss", less: "less",
    json: "json", yaml: "yaml", yml: "yaml", toml: "toml", xml: "xml",
    md: "markdown", sh: "bash", sql: "sql", dockerfile: "dockerfile",
  };
  return ext ? map[ext] : undefined;
}

/**
 * Standalone file preview pane — sits between chat and workspace.
 * Supports all file types: HTML (rendered iframe), images, PDF, markdown,
 * source code (syntax highlighted), and plain text.
 *
 * When a file is selected, it fetches preview data via app.ReadFile (or
 * app.PreviewHtmlFile for HTML) and renders it. For HTML files, the element
 * picker is available to select DOM elements and send them to chat.
 */
export function FilePreviewPane({
  filePath,
  onAddToChat,
  onClose,
  onToggleMaximize,
  maximized,
}: {
  filePath: string | null;
  onAddToChat?: (text: string, opts?: { fold?: boolean; foldLabel?: string; foldMeta?: string }) => void;
  onClose: () => void;
  onToggleMaximize: () => void;
  maximized: boolean;
}) {
  const [preview, setPreview] = useState<FilePreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"preview" | "source">("preview");
  const [picking, setPicking] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const isHtml = filePath ? /\.(html?|htm)$/i.test(filePath) : false;
  const isMarkdown = filePath ? /\.md$/i.test(filePath) : false;

  // Fetch preview data when filePath changes.
  useEffect(() => {
    if (!filePath) {
      setPreview(null);
      return;
    }
    let live = true;
    setLoading(true);
    const fetcher = isHtml ? app.PreviewHtmlFile(filePath) : app.ReadFile(filePath);
    fetcher
      .then((data) => { if (live) { setPreview(data); setMode("preview"); } })
      .catch((e) => {
        if (live) setPreview({ path: filePath, body: "", size: 0, truncated: false, binary: false, err: String((e as Error)?.message ?? e) });
      })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [filePath, isHtml]);

  // Forward picker results from iframe to chat composer.
  useEffect(() => {
    function onMsg(e: MessageEvent) {
      const data = e.data as { __reasonixPicker?: boolean; html?: string; tag?: string } | null;
      if (!data || !data.__reasonixPicker) return;
      setPicking(false);
      if (!data.html || !filePath) return;
      const fence = "```";
      const safeFence = data.html.includes(fence) ? "````" : fence;
      const ref = `From \`${filePath}\` (selected <${data.tag ?? "element"}>):\n\n${safeFence}html\n${data.html}\n${safeFence}`;
      const label = `⟨${data.tag ?? "element"}⟩`;
      onAddToChat?.(ref, { fold: true, foldLabel: label, foldMeta: `from ${basename(filePath)}` });
    }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [filePath, onAddToChat]);

  const togglePicker = useCallback(() => {
    setPicking((p) => !p);
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentWindow) return;
    try {
      (iframe.contentWindow as unknown as { eval?: (s: string) => void }).eval?.(PICKER_SCRIPT);
    } catch { /* not ready */ }
  }, []);

  const p = preview;

  return (
    <aside className="file-preview-pane">
      <div className="file-preview-pane__header">
        <Tooltip label={filePath ?? ""}>
          <span className="file-preview-pane__title">
            {p ? basename(p.path) : filePath ? basename(filePath) : "文件预览"}
          </span>
        </Tooltip>
        <div className="file-preview-pane__actions">
          {isHtml && p?.url && (
            <>
              <div className="file-preview-pane__toggle" role="tablist">
                <button type="button" role="tab" aria-selected={mode === "preview"}
                  className={"file-preview-pane__tab" + (mode === "preview" ? " is-active" : "")}
                  onClick={() => setMode("preview")} title="渲染预览">
                  <Eye size={13} />
                </button>
                <button type="button" role="tab" aria-selected={mode === "source"}
                  className={"file-preview-pane__tab" + (mode === "source" ? " is-active" : "")}
                  onClick={() => setMode("source")} title="查看源代码">
                  <Code2 size={13} />
                </button>
              </div>
              {mode === "preview" && (
                <Tooltip label={picking ? "点击元素选中（ESC 结束）" : "选中元素"}>
                  <button type="button" className={"file-preview-pane__iconbtn" + (picking ? " is-active" : "")} onClick={togglePicker}>
                    <MousePointerClick size={14} />
                  </button>
                </Tooltip>
              )}
            </>
          )}
          <Tooltip label={maximized ? "还原" : "最大化"}>
            <button type="button" className="file-preview-pane__iconbtn" onClick={onToggleMaximize}>
              {maximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
          </Tooltip>
          <Tooltip label="关闭">
            <button type="button" className="file-preview-pane__iconbtn" onClick={onClose}>
              <X size={15} />
            </button>
          </Tooltip>
        </div>
      </div>
      <div className="file-preview-pane__body">
        {loading ? (
          <div className="file-preview-pane__empty">加载中…</div>
        ) : p?.err ? (
          <div className="file-preview-pane__empty file-preview-pane__empty--error">{p.err}</div>
        ) : !p ? (
          <div className="file-preview-pane__empty">未选择文件</div>
        ) : p.kind === "image" && p.url ? (
          <div className="file-preview-pane__media">
            <img src={p.url} alt={basename(p.path)} />
          </div>
        ) : p.kind === "pdf" && p.url ? (
          <iframe className="file-preview-pane__iframe" src={p.url} title={basename(p.path)} />
        ) : p.kind === "html" && p.url ? (
          mode === "preview" ? (
            <iframe ref={iframeRef} className="file-preview-pane__iframe" src={p.url}
              sandbox="allow-scripts allow-popups allow-forms allow-same-origin" title={basename(p.path)} />
          ) : (
            <CodeViewer value={p.body || " "} language="html" maxHeight={0} />
          )
        ) : p.binary ? (
          <div className="file-preview-pane__empty">二进制文件</div>
        ) : isMarkdown ? (
          <div className="file-preview-pane__markdown">
            <MarkdownRenderer text={p.body} />
          </div>
        ) : (
          <>
            {p.truncated && <div className="file-preview-pane__note">已截断</div>}
            <CodeViewer value={p.body || " "} language={languageFor(p.path)} maxHeight={0} />
          </>
        )}
      </div>
    </aside>
  );
}
