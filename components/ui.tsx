import type { ReactNode } from "react";

export function SectionHeader({ eyebrow, title, meta }: { eyebrow: string; title: string; meta?: string }) {
  return (
    <div className="section-header">
      <div>
        <span className="micro-label">{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      {meta ? <span className="section-meta">{meta}</span> : null}
    </div>
  );
}

export function MetricCard({
  label,
  value,
  sub,
  children
}: {
  label: string;
  value: string;
  sub?: string;
  children?: ReactNode;
}) {
  return (
    <div className="metric-card">
      <span className="micro-label">{label}</span>
      <strong>{value}</strong>
      {sub ? <small>{sub}</small> : null}
      {children}
    </div>
  );
}

export function EmptyState({ query }: { query: string }) {
  return (
    <div className="empty-state">
      <strong>No records match “{query}”.</strong>
      <span>Clear the filter or edit the JSON dataset to add another record.</span>
    </div>
  );
}

export function ToggleGroup({
  value,
  values,
  onChange,
  label
}: {
  value: string;
  values: string[];
  onChange: (value: string) => void;
  label: string;
}) {
  return (
    <div className="toggle-group" role="group" aria-label={label}>
      {values.map((item) => (
        <button
          key={item}
          type="button"
          className={value === item ? "active" : ""}
          onClick={() => onChange(item)}
        >
          {item}
        </button>
      ))}
    </div>
  );
}
