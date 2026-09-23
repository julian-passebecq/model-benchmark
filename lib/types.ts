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
  freeAccessServiceId?: string;
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


export type FreeTierType = "true-free" | "trial" | "local-free" | "open-source";

export type FreeLabService = {
  id: string;
  name: string;
  provider: string;
  category: string;
  tierType: FreeTierType;
  duration: string;
  cardRequired: string;
  quota: string;
  goodFor: string;
  limits: string;
  commercialUse: string;
  platforms?: string;
  source: SourceRef;
};

export type RuntimeProfile = {
  id: string;
  name: string;
  language: string;
  execution: string;
  nodeModel: string;
  startup: string;
  parallelism: string;
  optimizer: string;
  pythonBoundary: string;
  bestFor: string;
  watchFor: string;
  source: SourceRef;
};

export type RuntimeBenchmarkTemplate = {
  id: string;
  name: string;
  dataset: string;
  size: string;
  operations: string[];
  engines: string[];
  hardware: string;
  lesson: string;
};


export type ServerlessService = {
  id: string;
  name: string;
  provider: string;
  unit: string;
  freeQuota: string;
  billing: string;
  packaging: string;
  runtimes: string;
  scaleToZero: boolean;
  container: boolean;
  goodFor: string;
  watchFor: string;
  source: SourceRef;
};


export type SelfHostScenario = {
  id: string;
  name: string;
  software: string;
  labShape: string;
  managedAlternative: string;
  workload: string;
  caveat: string;
};


export type FreeTierOffer = {
  id: string;
  provider: string;
  product: string;
  category: string;
  tierType: "always-free" | "trial" | "credit";
  trueFree: boolean;
  summary: string;
  limits: string;
  bestFor: string;
  creditCard: string;
  commercial: string;
  source: SourceRef;
  score: number;
};

export type CommunityTool = {
  id: string;
  name: string;
  category: string;
  license: string;
  cloudEquivalent: string;
  bestFor: string;
};

export type RuntimeFramework = {
  id: string;
  name: string;
  language: string;
  kind: string;
  execution: string;
  coldStart: string;
  concurrency: string;
  dataScale: string;
  bestFor: string;
  avoidWhen: string;
  managedExamples: string[];
  source: SourceRef;
};

export type QueryScenario = {
  id: string;
  name: string;
  engine: string;
  language: string;
  scale: string;
  operation: string;
  latencyClass: string;
  memoryModel: string;
  distributed: boolean;
  notes: string;
};


export type FreeTierUseCaseGuide = {
  id: string;
  title: string;
  category: string;
  goal: string;
  serviceIds: string[];
  recommendedPattern: string;
  watchFor: string;
  nextStep: string;
};


export type TechnologyRelease = {
  id: string;
  name: string;
  category: string;
  latestStable: string;
  releaseDate: string;
  status: string;
  productionBaseline: string;
  nextPreview: string;
  highlights: string[];
  whyItMatters: string;
  compatibility: string;
  source: SourceRef;
};
