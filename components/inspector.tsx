import { ExternalLink, PanelRightClose } from "lucide-react";
import type { InspectorRecord } from "../lib/types";

export function Inspector({ record, onClose }: { record: InspectorRecord; onClose: () => void }) {
  return (
    <div className="inspector">
      <div className="inspector-head">
        <div>
          <span className="micro-label">{record.eyebrow ?? "INSPECTOR"}</span>
          <h2>{record.title}</h2>
        </div>
        <button className="panel-collapse" type="button" onClick={onClose} aria-label="Close inspector">
          <PanelRightClose size={15} />
        </button>
      </div>

      {record.description ? <p className="inspector-description">{record.description}</p> : null}

      {record.stats?.length ? (
        <div className="inspector-stats">
          {record.stats.map((stat) => (
            <div key={stat.label}>
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
            </div>
          ))}
        </div>
      ) : null}

      {record.tags?.length ? (
        <div className="tag-row">
          {record.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}
        </div>
      ) : null}

      {record.note ? (
        <div className="note-block">
          <span className="micro-label">CAVEAT / NOTE</span>
          <p>{record.note}</p>
        </div>
      ) : null}

      {record.source ? (
        <a className="source-link" href={record.source.url} target="_blank" rel="noreferrer">
          <div>
            <span className="micro-label">SOURCE</span>
            <strong>{record.source.label}</strong>
            {record.source.asOf ? <small>as of {record.source.asOf}</small> : null}
          </div>
          <ExternalLink size={15} />
        </a>
      ) : null}
    </div>
  );
}
