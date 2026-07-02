import { useEffect, useRef, useState } from "react";
import { Eye, Code2 } from "lucide-react";
import { CopyButton } from "./CopyButton";

/**
 * Renders an HTML code block in chat with a preview/source toggle,
 * similar to MermaidDiagram. The preview uses a sandboxed iframe (srcDoc)
 * so the HTML renders as a real page without touching the parent app.
 */
export default function HtmlBlock({ source }: { source: string }) {
  const [mode, setMode] = useState<"preview" | "source">("preview");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeHeight, setIframeHeight] = useState<number | undefined>(undefined);

  // Listen for resize messages from the sandboxed iframe.
  useEffect(() => {
    function onMsg(e: MessageEvent) {
      const data = e.data as { __htmlBlockResize?: boolean; h?: number } | null;
      if (!data || !data.__htmlBlockResize || typeof data.h !== "number") return;
      setIframeHeight(data.h);
    }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  return (
    <div className="md-html-block">
      <div className="md-mermaid-block__toolbar">
        <span className="md-mermaid-block__label">HTML</span>
        <div className="md-mermaid-block__actions">
          <div className="md-mermaid-block__toggle" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={mode === "preview"}
              className={"md-mermaid-block__tab" + (mode === "preview" ? " is-active" : "")}
              onClick={() => setMode("preview")}
              title="渲染预览"
            >
              <Eye size={13} />
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "source"}
              className={"md-mermaid-block__tab" + (mode === "source" ? " is-active" : "")}
              onClick={() => setMode("source")}
              title="查看源代码"
            >
              <Code2 size={13} />
            </button>
          </div>
          <CopyButton
            text={source}
            label="源码"
            className="md-mermaid-block__copy md-mermaid-block__copy--labeled"
            showInlineLabel
          />
        </div>
      </div>
      <div className="md-html-block__body">
        {mode === "preview" ? (
          <iframe
            ref={iframeRef}
            className="md-html-block__iframe"
            srcDoc={`<script>function _rs(){var h=document.body.scrollHeight;parent.postMessage({__htmlBlockResize:true,h:h+20},'*')}window.addEventListener('load',_rs);setTimeout(_rs,100);setTimeout(_rs,500)<\/script>${source}`}
            sandbox="allow-scripts"
            title="HTML preview"
            style={iframeHeight ? { height: `${iframeHeight}px` } : undefined}
          />
        ) : (
          <pre className="md-mermaid-block__source">
            <code>{source}</code>
          </pre>
        )}
      </div>
    </div>
  );
}
