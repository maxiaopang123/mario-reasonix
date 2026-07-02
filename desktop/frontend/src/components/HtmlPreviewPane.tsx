import { useCallback, useEffect, useRef, useState } from "react";
import { Eye, Code2, MousePointerClick, X, Maximize2, Minimize2 } from "lucide-react";
import { Tooltip } from "./Tooltip";
import { CodeViewer } from "./CodeViewer";
import type { FilePreview } from "../lib/types";

// Element picking injects a script that turns on hover-highlight; the iframe
// reports back the chosen element's outerHTML, which we forward to the chat
// composer via onAddToChat.
const PICKER_SCRIPT = `
(function(){
  if (window.__reasonixPickerActive) { window.__reasonixPickerActive = !window.__reasonixPickerActive; return; }
  window.__reasonixPickerActive = true;
  var overlay = document.createElement('div');
  overlay.id = '__reasonix_picker_highlight';
  overlay.style.cssText = 'position:fixed;pointer-events:none;z-index:2147483647;border:2px solid #4f9cff;background:rgba(79,156,255,0.12);transition:all 60ms ease;display:none;';
  document.body.appendChild(overlay);
  function position(el){
    var r = el.getBoundingClientRect();
    overlay.style.display = 'block';
    overlay.style.left = r.left + 'px';
    overlay.style.top = r.top + 'px';
    overlay.style.width = r.width + 'px';
    overlay.style.height = r.height + 'px';
  }
  function onMove(e){
    if (!window.__reasonixPickerActive) return;
    var el = document.elementFromPoint(e.clientX, e.clientY);
    if (!el || el === overlay || el.id === '__reasonix_picker_highlight') return;
    position(el);
  }
  function onKey(e){
    if (e.key === 'Escape') cleanup();
  }
  function onClick(e){
    if (!window.__reasonixPickerActive) return;
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    var el = document.elementFromPoint(e.clientX, e.clientY);
    if (!el || el.id === '__reasonix_picker_highlight') return;
    parent.postMessage({ __reasonixPicker: true, html: el.outerHTML, tag: el.tagName.toLowerCase() }, '*');
  }
  function cleanup(){
    window.__reasonixPickerActive = false;
    document.removeEventListener('mousemove', onMove, true);
    document.removeEventListener('click', onClick, true);
    document.removeEventListener('keydown', onKey, true);
    var o = document.getElementById('__reasonix_picker_highlight');
    if (o) o.remove();
  }
  document.addEventListener('mousemove', onMove, true);
  document.addEventListener('click', onClick, true);
  document.addEventListener('keydown', onKey, true);
})();
`;

function basename(path: string): string {
  const clean = path.replace(/[\\/]+$/, "");
  return clean.split(/[\\/]/).filter(Boolean).pop() ?? path;
}

/**
 * Standalone HTML preview pane that sits between chat and workspace.
 * Renders an HTML file in a sandboxed iframe with:
 *  - preview / source toggle
 *  - element picker (hover-highlight → click → send outerHTML to chat)
 *  - maximize / restore
 *  - close
 *
 * Width is controlled by an external drag handle managed by the parent
 * (App.tsx), so this component just fills its container.
 */
export function HtmlPreviewPane({
  preview,
  onAddToChat,
  onClose,
  onToggleMaximize,
  maximized,
}: {
  preview: FilePreview | null;
  onAddToChat?: (text: string, opts?: { fold?: boolean; foldLabel?: string; foldMeta?: string }) => void;
  onClose: () => void;
  onToggleMaximize: () => void;
  maximized: boolean;
}) {
  const [mode, setMode] = useState<"preview" | "source">("preview");
  const [picking, setPicking] = useState(false);
  const [, setLoading] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [livePreview, setLivePreview] = useState<FilePreview | null>(null);

  // Fetch preview data when the path changes.
  useEffect(() => {
    if (!preview?.path || preview.err) {
      setLivePreview(preview);
      return;
    }
    // If the caller already fetched (has url or body), use it directly.
    if (preview.url || preview.body) {
      setLivePreview(preview);
      setLoading(false);
      return;
    }
  }, [preview]);

  const p = livePreview;

  // Forward picker results from the iframe to the chat composer.
  useEffect(() => {
    function onMsg(e: MessageEvent) {
      const data = e.data as { __reasonixPicker?: boolean; html?: string; tag?: string } | null;
      if (!data || !data.__reasonixPicker) return;
      setPicking(false);
      if (!data.html || !p) return;
      const fence = "```";
      const safeFence = data.html.includes(fence) ? "````" : fence;
      const ref = `From \`${p.path}\` (selected <${data.tag ?? "element"}>):\n\n${safeFence}html\n${data.html}\n${safeFence}`;
      const label = `⟨${data.tag ?? "element"}⟩`;
      onAddToChat?.(ref, { fold: true, foldLabel: label, foldMeta: `from ${basename(p.path)}` });
    }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [p, onAddToChat]);

  const togglePicker = useCallback(() => {
    const next = !picking;
    setPicking(next);
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentWindow) return;
    try {
      (iframe.contentWindow as unknown as { eval?: (s: string) => void }).eval?.(PICKER_SCRIPT);
    } catch {
      /* cross-origin / not ready */
    }
  }, [picking]);

  if (!p || p.err) {
    return (
      <aside className="html-pane">
        <div className="html-pane__header">
          <span className="html-pane__title">HTML 预览</span>
          <div className="html-pane__actions">
            <Tooltip label="关闭">
              <button type="button" className="html-pane__iconbtn" onClick={onClose}>
                <X size={15} />
              </button>
            </Tooltip>
          </div>
        </div>
        <div className="html-pane__empty">
          {p?.err ?? "未选择 HTML 文件"}
        </div>
      </aside>
    );
  }

  return (
    <aside className="html-pane">
      <div className="html-pane__header">
        <Tooltip label={p.path}>
          <span className="html-pane__title">{basename(p.path)}</span>
        </Tooltip>
        <div className="html-pane__actions">
          <div className="html-pane__toggle" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={mode === "preview"}
              className={"html-pane__tab" + (mode === "preview" ? " is-active" : "")}
              onClick={() => setMode("preview")}
              title="渲染预览"
            >
              <Eye size={13} />
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "source"}
              className={"html-pane__tab" + (mode === "source" ? " is-active" : "")}
              onClick={() => setMode("source")}
              title="查看源代码"
            >
              <Code2 size={13} />
            </button>
          </div>
          {mode === "preview" && p.url && (
            <Tooltip label={picking ? "点击页面元素选中（ESC 结束）" : "选中元素"}>
              <button
                type="button"
                className={"html-pane__iconbtn" + (picking ? " is-active" : "")}
                onClick={togglePicker}
              >
                <MousePointerClick size={14} />
              </button>
            </Tooltip>
          )}
          <Tooltip label={maximized ? "还原" : "最大化"}>
            <button type="button" className="html-pane__iconbtn" onClick={onToggleMaximize}>
              {maximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
          </Tooltip>
          <Tooltip label="关闭">
            <button type="button" className="html-pane__iconbtn" onClick={onClose}>
              <X size={15} />
            </button>
          </Tooltip>
        </div>
      </div>
      <div className="html-pane__body">
        {mode === "preview" && p.url ? (
          <iframe
            ref={iframeRef}
            className="html-pane__iframe"
            src={p.url}
            sandbox="allow-scripts allow-popups allow-forms allow-same-origin"
            title={basename(p.path)}
          />
        ) : (
          <>
            {p.truncated && <div className="workspace-note">已截断</div>}
            <CodeViewer value={p.body || " "} language="html" maxHeight={0} />
          </>
        )}
      </div>
    </aside>
  );
}
