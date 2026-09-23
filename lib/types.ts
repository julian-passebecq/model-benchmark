export type DashboardId = "models" | "data" | "cloud" | "hardware" | "evolution";

export type SourceRef = {
  label: string;
  url: string;
  asOf?: string;
};

export type InspectorRecord = {
  title: string;
  eyebrow?: string;
  description?: string;
  stats?: Array<{ label: string; value: string }>;
  tags?: string[];
  source?: SourceRef;
  note?: string;
};

export type ModelBenchmark = {
  id: string;
  label: string;
  provider: string;
  family: string;
  surface: string;
  effort: string;
  score: number;
  costPerTask: number;
  latencySec: number | null;
  inputUsdPer1M: number | null;
  outputUsdPer1M: number | null;
  benchmark: string;
  current: boolean;
  dataQuality: "reference-image" | "upstream" | "manual";
  sourceLabel: string;
  sourceUrl: string;
  asOf: string;
  note?: string;
};

export type DataEngine = {
  id: string;
  name: string;
  kind: string;
  execution: string;
  distributed: boolean;
  lazy: boolean;
  vectorized: boolean;
  sql: boolean;
  streaming: string;
  scale: string;
  languages: string[];
  bestFor: string;
  tradeoff: string;
  source: SourceRef;
};

export type DataFormat = {
  id: string;
  name: string;
  kind: string;
  acid: string;
  timeTravel: boolean;
  schemaEvolution: string;
  partitionEvolution: boolean;
  multiEngine: string;
  storageLayer: string;
  bestFor: string;
  tradeoff: string;
  source: SourceRef;
};

export type BenchmarkRun = {
  id: string;
  scenario: string;
  datasetTb: number;
  operation: string;
  engine: string;
  seconds: number;
  workers: string;
  sourceType: "illustrative-template" | "measured";
  sourceLabel: string;
  sourceUrl: string;
  note: string;
};

export type LanguageRuntime = {
  id: string;
  name: string;
  version: string;
  paradigm: string;
  strength: string;
  dataRole: string;
  performance: number;
  ergonomics: number;
  ecosystem: number;
  source: SourceRef;
};

export type CloudPlatform = {
  id: string;
  name: string;
  vendor: string;
  computeModel: string;
  pricingModel: string;
  serverless: string;
  lakehouse: string;
  warehouse: string;
  streaming: string;
  orchestration: string;
  governance: string;
  aiMl: string;
  bi: string;
  openFormats: string;
  bestFor: string;
  tradeoff: string;
  source: SourceRef;
};

export type QueryPrice = {
  id: string;
  platform: string;
  service: string;
  unit: string;
  usd: number | null;
  freeTier: string;
  region: string;
  note: string;
  source: SourceRef;
};

export type VmShape = {
  id: string;
  cloud: string;
  family: string;
  vcpu: number;
  ramGb: number;
  accelerator: string;
  workload: string;
  usdHour: number | null;
  region: string;
  note: string;
  source: SourceRef;
};

export type HardwareItem = {
  id: string;
  name: string;
  vendor: string;
  kind: string;
  year: number;
  cores: string;
  memory: string;
  powerW: number | null;
  process: string;
  perfIndex: number;
  perfPerWatt: number;
  price: string;
  bestFor: string;
  source: SourceRef;
};

export type MobileSoc = {
  id: string;
  name: string;
  vendor: string;
  year: number;
  process: string;
  cpu: string;
  gpu: string;
  ai: string;
  class: string;
  note: string;
  source: SourceRef;
};

export type EvolutionItem = {
  id: string;
  category: "accelerator" | "network" | "display" | "energy";
  year: number;
  name: string;
  metric: string;
  value: number;
  unit: string;
  status: string;
  description: string;
  source: SourceRef;
};


export type TerminalBenchEffortPoint = {
  id: string;
  series: string;
  provider: string;
  effort: "low" | "medium" | "high" | "xhigh" | "max";
  cost: number;
  score: number;
  exact: boolean;
};

export type CodingAgentFrontierPoint = {
  id: string;
  agent: string;
  model: string;
  provider: string;
  cost: number;
  score: number;
  timeMinutes: number;
  tokensMillions: number;
  frontier: boolean;
};

export type BenchmarkMeta = {
  benchmark: string;
  sourceLabel: string;
  sourceUrl: string;
  asOf: string;
  note: string;
};
