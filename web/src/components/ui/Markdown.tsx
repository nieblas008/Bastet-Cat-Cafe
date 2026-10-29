import { Fragment, type ReactNode } from "react";

/**
 * Markdown mínimo y seguro para los textos que escribe el equipo:
 * párrafos, ## títulos, listas (- y 1.), > citas, **negritas**, *cursivas* y [enlaces](url).
 * No interpreta HTML, así que no hay forma de inyectar código.
 */
export function Markdown({ text, className = "prose-bastet" }: { text: string | null | undefined; className?: string }) {
  if (!text?.trim()) return null;
  const blocks = text.replace(/\r\n/g, "\n").trim().split(/\n{2,}/);
  return (
    <div className={className}>
      {blocks.map((block, i) => (
        <Fragment key={i}>{renderBlock(block)}</Fragment>
      ))}
    </div>
  );
}

function renderBlock(block: string): ReactNode {
  const lines = block.split("\n");
  const first = lines[0];
  if (/^###\s/.test(first)) return <h3>{inline(first.replace(/^###\s+/, ""))}</h3>;
  if (/^##?\s/.test(first)) return <h2>{inline(first.replace(/^##?\s+/, ""))}</h2>;
  if (lines.every((l) => /^\s*[-*•]\s+/.test(l))) {
    return (
      <ul>
        {lines.map((l, i) => (
          <li key={i}>{inline(l.replace(/^\s*[-*•]\s+/, ""))}</li>
        ))}
      </ul>
    );
  }
  if (lines.every((l) => /^\s*\d+[.)]\s+/.test(l))) {
    return (
      <ol>
        {lines.map((l, i) => (
          <li key={i}>{inline(l.replace(/^\s*\d+[.)]\s+/, ""))}</li>
        ))}
      </ol>
    );
  }
  if (lines.every((l) => /^>\s?/.test(l))) {
    return <blockquote>{inline(lines.map((l) => l.replace(/^>\s?/, "")).join(" "))}</blockquote>;
  }
  return (
    <p>
      {lines.map((l, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          {inline(l)}
        </Fragment>
      ))}
    </p>
  );
}

const TOKEN = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)\s]+\))/g;

function inline(text: string): ReactNode[] {
  return text.split(TOKEN).map((part, i) => {
    if (/^\*\*[^*]+\*\*$/.test(part)) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (/^\*[^*]+\*$/.test(part)) return <em key={i}>{part.slice(1, -1)}</em>;
    const link = part.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
    if (link) {
      const href = safeHref(link[2]);
      if (!href) return link[1];
      const external = /^https?:/.test(href);
      return (
        <a key={i} href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
          {link[1]}
        </a>
      );
    }
    return part;
  });
}

function safeHref(href: string) {
  if (/^(https?:|mailto:|tel:|\/|#)/i.test(href)) return href;
  return null;
}
