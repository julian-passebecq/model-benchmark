"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  Box,
  BrainCircuit,
  ChevronLeft,
  ChevronRight,
  Cloud,
  Cpu,
  Database,
  Github,
  PanelLeftClose,
  PanelRightClose,
  Search,
  Settings2,
  Zap
} from "lucide-react";
import { CloudDashboard } from "./views/cloud-dashboard";
import { DataDashboard } from "./views/data-dashboard";
import { EvolutionDashboard } from "./views/evolution-dashboard";
import { HardwareDashboard } from "./views/hardware-dashboard";
import { ModelsDashboard } from "./views/models-dashboard";
import { Inspector } from "./inspector";
import { snapshot } from "../lib/data";
import type { DashboardId, InspectorRecord } from "../lib/types";

const nav = [
  { id: "models" as const, label: "Model efficiency", short: "AI", icon: BrainCircuit },
  { id: "data" as const, label: "Modern data stack", short: "DATA", icon: Database },
  { id: "cloud" as const, label: "Cloud platforms", short: "CLOUD", icon: Cloud },
  { id: "hardware" as const, label: "Compute & devices", short: "HW", icon: Cpu },
  { id: "evolution" as const, label: "Infra evolution", short: "INFRA", icon: Activity }
];

const titles: Record<DashboardId, { title: string; subtitle: string }> = {
  models: {
    title: "Model Efficiency Observatory",
    subtitle: "Compare agent quality, cost, provider, effort and cost-efficiency without losing the underlying benchmark context."
  },
  data: {
    title: "Modern Data Stack Observatory",
    subtitle: "Engines, open table formats, query patterns, programming abstractions and reproducible performance runs."
  },
  cloud: {
    title: "Cloud Data Platform Observatory",
    subtitle: "Databricks, Fabric, BigQuery, Snowflake and AWS across architecture, pricing models, managed services and VM patterns."
  },
  hardware: {
    title: "Compute & Device Observatory",
    subtitle: "CPU, GPU, laptop and mobile silicon: performance direction, efficiency, form factor and workload fit."
  },
  evolution: {
    title: "Infrastructure Evolution Observatory",
    subtitle: "Accelerators, optical/network bandwidth, mobile generations, displays and datacenter energy constraints on one timeline."
  }
};

function DefaultInspector({ dashboard }: { dashboard: DashboardId }): InspectorRecord {
  const item = titles[dashboard];
  return {
    eyebrow: "Workspace",
    title: item.title,
    description: "Select a point, row, card or timeline item to inspect its metrics, caveats and source.",
    stats: [
      { label: "Snapshot", value: snapshot.asOf },
      { label: "Data store", value: "Git JSON" }
    ],
    tags: ["editable", "source-aware", "local-first"],
    note: "Every dashboard reads static JSON from /data so updates can be reviewed in Git like code."
  };
}

export default function DashboardApp() {
  const [dashboard, setDashboard] = useState<DashboardId>("models");
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [query, setQuery] = useState("");
  const [inspect, setInspect] = useState<InspectorRecord>(() => DefaultInspector({ dashboard: "models" }));

  const heading = titles[dashboard];
  const currentNavIndex = nav.findIndex((item) => item.id === dashboard);

  const shellClass = useMemo(
    () => [
      "app-shell",
      leftOpen ? "left-open" : "left-closed",
      rightOpen ? "right-open" : "right-closed"
    ].join(" "),
    [leftOpen, rightOpen]
  );

  const switchDashboard = (id: DashboardId) => {
    setDashboard(id);
    setInspect(DefaultInspector({ dashboard: id }));
    setQuery("");
  };

  const stepDashboard = (direction: -1 | 1) => {
    const next = (currentNavIndex + direction + nav.length) % nav.length;
    switchDashboard(nav[next].id);
  };

  return (
    <main className={shellClass}>
      <header className="top-ribbon">
        <div className="brand-lockup">
          <div className="brand-mark"><Zap size={17} /></div>
          <div>
            <strong>BENCHMARK / OBSERVATORY</strong>
            <span>v0.1 · snapshot {snapshot.asOf}</span>
          </div>
        </div>

        <div className="ribbon-tabs" aria-label="Dashboard sections">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                className={dashboard === item.id ? "ribbon-tab active" : "ribbon-tab"}
                onClick={() => switchDashboard(item.id)}
                title={item.label}
              >
                <Icon size={15} />
                <span>{item.short}</span>
              </button>
            );
          })}
        </div>

        <div className="ribbon-actions">
          <a
            className="icon-button"
            href="https://github.com/julian-passebecq/model-benchmark"
            target="_blank"
            rel="noreferrer"
            aria-label="Open GitHub repository"
          >
            <Github size={16} />
          </a>
          <button
            className="icon-button"
            type="button"
            aria-label="Toggle left navigation"
            onClick={() => setLeftOpen((value) => !value)}
          >
            <PanelLeftClose size={16} />
          </button>
          <button
            className="icon-button"
            type="button"
            aria-label="Toggle inspector"
            onClick={() => setRightOpen((value) => !value)}
          >
            <PanelRightClose size={16} />
          </button>
        </div>
      </header>

      <aside className="left-panel">
        <div className="left-panel-head">
          <span className="micro-label">OBSERVATORIES</span>
          <button className="panel-collapse" type="button" onClick={() => setLeftOpen(false)} aria-label="Collapse left panel">
            <ChevronLeft size={15} />
          </button>
        </div>

        <nav className="side-nav">
          {nav.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                type="button"
                key={item.id}
                className={dashboard === item.id ? "side-nav-item active" : "side-nav-item"}
                onClick={() => switchDashboard(item.id)}
              >
                <span className="nav-index">0{index + 1}</span>
                <Icon size={18} />
                <span>
                  <strong>{item.label}</strong>
                  <small>{item.short}</small>
                </span>
              </button>
            );
          })}
        </nav>

        <div className="left-panel-card">
          <Box size={16} />
          <div>
            <strong>Git-backed JSON</strong>
            <p>Edit <code>/data/*.json</code>. The UI updates without rewriting dashboard logic.</p>
          </div>
        </div>

        <div className="left-panel-card">
          <Settings2 size={16} />
          <div>
            <strong>Source-aware records</strong>
            <p>Rows carry source URL, date and caveat fields so benchmarks can distinguish measured, official and illustrative data.</p>
          </div>
        </div>
      </aside>

      {!leftOpen ? (
        <button className="floating-left-open" type="button" onClick={() => setLeftOpen(true)} aria-label="Open left panel">
          <ChevronRight size={16} />
        </button>
      ) : null}

      <section className="workspace">
        <div className="workspace-head">
          <div className="heading-wrap">
            <div className="breadcrumb">KNOWLEDGE CONSOLE / {dashboard.toUpperCase()}</div>
            <h1>{heading.title}</h1>
            <p>{heading.subtitle}</p>
          </div>

          <div className="head-tools">
            <label className="global-search">
              <Search size={16} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Filter current view"
                aria-label="Filter current dashboard"
              />
              <kbd>/</kbd>
            </label>
            <div className="stepper">
              <button type="button" onClick={() => stepDashboard(-1)} aria-label="Previous dashboard"><ChevronLeft size={15} /></button>
              <span>0{currentNavIndex + 1} / 05</span>
              <button type="button" onClick={() => stepDashboard(1)} aria-label="Next dashboard"><ChevronRight size={15} /></button>
            </div>
          </div>
        </div>

        <div className="dashboard-stage">
          {dashboard === "models" ? <ModelsDashboard query={query} onInspect={setInspect} /> : null}
          {dashboard === "data" ? <DataDashboard query={query} onInspect={setInspect} /> : null}
          {dashboard === "cloud" ? <CloudDashboard query={query} onInspect={setInspect} /> : null}
          {dashboard === "hardware" ? <HardwareDashboard query={query} onInspect={setInspect} /> : null}
          {dashboard === "evolution" ? <EvolutionDashboard query={query} onInspect={setInspect} /> : null}
        </div>
      </section>

      <aside className="right-panel">
        <Inspector record={inspect} onClose={() => setRightOpen(false)} />
      </aside>

      {!rightOpen ? (
        <button className="floating-right-open" type="button" onClick={() => setRightOpen(true)} aria-label="Open inspector">
          <ChevronLeft size={16} />
        </button>
      ) : null}
    </main>
  );
}
