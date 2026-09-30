export type DiagramType = "architecture" | "workflow" | "sequence" | "dataflow" | "lifecycle";

export type VisualPreset = "classic" | "signal-flow" | "blueprint" | "editorial";
export type QualityProfile = "standard" | "showcase";
export type AnimationMode = "trace" | "none";
export type LegendMode = "auto" | "all" | "hidden";
export type ComponentType = "frontend" | "backend" | "database" | "cloud" | "security" | "messagebus" | "external";
export type NodeIcon =
  | "calendar"
  | "clock"
  | "person"
  | "briefcase"
  | "flag"
  | "moon"
  | "frontend"
  | "backend"
  | "database"
  | "cloud"
  | "security"
  | "messagebus"
  | "external"
  | "start"
  | "active"
  | "waiting"
  | "success"
  | "failure"
  | "neutral"
  | "none";
export type Variant = "default" | "emphasis" | "security" | "dashed";
export type Side = "left" | "right" | "top" | "bottom";
export type RelationshipWidth = number;
export type Point = [number, number];
export type CardDot = "cyan" | "emerald" | "violet" | "amber" | "rose" | "orange" | "slate";

export interface BrandMark {
  url: string;
  sha256?: string;
}

export interface SourceReference {
  path: string;
  line?: number;
  end_line?: number;
  label?: string;
}

export interface LegendEntry {
  label: string;
  visible?: boolean;
}

export interface GuidedView {
  id: string;
  label: string;
  focus: string[];
  note?: string;
}

export interface RepositoryRef {
  url: string;
  provider: "github" | "gitee";
  link_mode: "web" | "local-only";
  revision: string;
}

export interface LegendConfig {
  mode?: LegendMode;
  entries?: Record<ComponentType, LegendEntry>;
}

export interface Card {
  dot: CardDot;
  title: string;
  items: string[];
}

// Common base meta for all diagram types
export interface BaseMeta {
  title: string;
  output: string;
  locale?: string;
  translations?: Record<string, string>;
  subtitle?: string;
  animation?: AnimationMode;
  visual_preset?: VisualPreset;
  quality_profile?: QualityProfile;
  repository?: RepositoryRef;
  views?: GuidedView[];
  legend?: LegendConfig;
  viewBox?: Point;
}

// Architecture diagram types
export interface ArchitectureComponent {
  id: string;
  type: ComponentType;
  label: string;
  sublabel?: string;
  tag?: string;
  icon?: NodeIcon;
  brand?: BrandMark;
  sources?: SourceReference[];
  row?: number;
  col?: number;
  pos?: Point;
  size?: Point;
}

export interface ArchitectureBoundary {
  kind: "region" | "security-group";
  label: string;
  wraps: string[];
  pad?: number;
}

export interface ArchitectureConnection {
  id?: string;
  from: string;
  to: string;
  label?: string;
  variant?: Variant;
  fromSide?: Side;
  toSide?: Side;
  route?: "auto" | "straight" | "orthogonal-h" | "orthogonal-v";
  via?: Point[];
  labelAt?: Point;
  labelDx?: number;
  labelDy?: number;
  labelSegment?: number;
  width?: RelationshipWidth;
}

export interface ArchitectureLayout {
  mode: "grid";
  origin?: Point;
  cols?: number;
  gapX?: number;
  gapY?: number;
  cellW?: number;
  cellH?: number;
}

export interface ArchitectureMeta extends BaseMeta {
  engineering_profile?: "deployment-ownership";
}

export interface ArchitectureDiagram {
  schema_version: 1;
  diagram_type: "architecture";
  meta: ArchitectureMeta;
  layout?: ArchitectureLayout;
  components: ArchitectureComponent[];
  boundaries?: ArchitectureBoundary[];
  connections?: ArchitectureConnection[];
  cards?: Card[];
}

// Workflow diagram types
export interface WorkflowLane {
  id: string;
  label: string;
  variant?: "normal" | "exception";
}

export interface WorkflowPhase {
  id: string;
  label: string;
  fromCol: number;
  toCol: number;
  variant?: Variant;
}

export interface WorkflowGroup {
  id: string;
  label: string;
  lane: string;
  fromCol: number;
  toCol: number;
  variant?: Variant;
}

export interface WorkflowNode {
  id: string;
  lane: string;
  col: number;
  type: ComponentType;
  label: string;
  sublabel?: string;
  tag?: string;
  icon?: NodeIcon;
  brand?: BrandMark;
  sources?: SourceReference[];
  width?: number;
  height?: number;
  yOffset?: number;
}

export interface WorkflowEdge {
  id?: string;
  from: string;
  to: string;
  label?: string;
  variant?: Variant;
  role?: "main" | "branch" | "async" | "return" | "error";
  fromSide?: Side;
  toSide?: Side;
  route?: "auto" | "straight" | "drop" | "outside-right" | "return-left" | "bottom-channel" | "up-channel";
  via?: Point[];
  labelAt?: Point;
  labelDx?: number;
  labelDy?: number;
  labelSegment?: number;
  channelX?: number;
  channelY?: number;
  bias?: number;
  width?: RelationshipWidth;
}

export interface WorkflowSemanticRelation {
  from: string;
  to: string;
}

export interface WorkflowSemanticChecks {
  allowedRoots?: string[];
  allowedTerminals?: string[];
  requiredEdges?: WorkflowSemanticRelation[];
  requiredPaths?: WorkflowSemanticRelation[];
}

export interface WorkflowMeta extends BaseMeta {}

export interface WorkflowDiagram {
  schema_version: 1 | 2;
  diagram_type: "workflow";
  meta: WorkflowMeta;
  lanes: WorkflowLane[];
  phases?: WorkflowPhase[];
  groups?: WorkflowGroup[];
  mainPath?: string[];
  semanticChecks?: WorkflowSemanticChecks;
  nodes: WorkflowNode[];
  edges?: WorkflowEdge[];
  cards?: Card[];
}

// Sequence diagram types
export interface SequenceParticipant {
  id: string;
  label: string;
  type: ComponentType;
  sublabel?: string;
  icon?: NodeIcon;
  brand?: BrandMark;
  sources?: SourceReference[];
}

export interface SequenceMessage {
  id?: string;
  from: string;
  to: string;
  label: string;
  variant?: Variant;
  kind?: "request" | "response" | "async" | "event" | "self";
  fromSide?: Side;
  toSide?: Side;
  route?: "auto" | "straight" | "orthogonal";
  via?: Point[];
  labelAt?: Point;
  labelDx?: number;
  labelDy?: number;
  labelSegment?: number;
  width?: RelationshipWidth;
}

export interface SequenceGroup {
  id: string;
  label: string;
  participants: string[];
  fromCol: number;
  toCol: number;
  variant?: Variant;
}

export interface SequenceMeta extends BaseMeta {}

export interface SequenceDiagram {
  schema_version: 1;
  diagram_type: "sequence";
  meta: SequenceMeta;
  participants: SequenceParticipant[];
  messages: SequenceMessage[];
  groups?: SequenceGroup[];
  cards?: Card[];
}

// Dataflow diagram types
export interface DataflowNode {
  id: string;
  type: ComponentType;
  label: string;
  sublabel?: string;
  tag?: string;
  icon?: NodeIcon;
  brand?: BrandMark;
  sources?: SourceReference[];
  x?: number;
  y?: number;
}

export interface DataflowEdge {
  id?: string;
  from: string;
  to: string;
  label?: string;
  variant?: Variant;
  kind?: "stream" | "batch" | "query" | "control";
  fromSide?: Side;
  toSide?: Side;
  route?: "auto" | "straight" | "orthogonal";
  via?: Point[];
  labelAt?: Point;
  labelDx?: number;
  labelDy?: number;
  labelSegment?: number;
  width?: RelationshipWidth;
}

export interface DataflowBoundary {
  kind: "region" | "security-group";
  label: string;
  wraps: string[];
  pad?: number;
}

export interface DataflowMeta extends BaseMeta {}

export interface DataflowDiagram {
  schema_version: 1;
  diagram_type: "dataflow";
  meta: DataflowMeta;
  nodes: DataflowNode[];
  edges?: DataflowEdge[];
  boundaries?: DataflowBoundary[];
  cards?: Card[];
}

// Lifecycle diagram types
export interface LifecycleState {
  id: string;
  label: string;
  type: "initial" | "terminal" | "active" | "waiting" | "error" | "transient";
  sublabel?: string;
  icon?: NodeIcon;
  brand?: BrandMark;
  sources?: SourceReference[];
  x?: number;
  y?: number;
}

export interface LifecycleTransition {
  id?: string;
  from: string;
  to: string;
  label?: string;
  variant?: Variant;
  trigger?: string;
  condition?: string;
  action?: string;
  fromSide?: Side;
  toSide?: Side;
  route?: "auto" | "straight" | "orthogonal" | "loop";
  via?: Point[];
  labelAt?: Point;
  labelDx?: number;
  labelDy?: number;
  labelSegment?: number;
  width?: RelationshipWidth;
}

export interface LifecycleRegion {
  id: string;
  label: string;
  wraps: string[];
  pad?: number;
}

export interface LifecycleMeta extends BaseMeta {}

export interface LifecycleDiagram {
  schema_version: 1;
  diagram_type: "lifecycle";
  meta: LifecycleMeta;
  states: LifecycleState[];
  transitions?: LifecycleTransition[];
  regions?: LifecycleRegion[];
  cards?: Card[];
}

// Union type for all diagrams
export type ArchifyDiagram =
  | ArchitectureDiagram
  | WorkflowDiagram
  | SequenceDiagram
  | DataflowDiagram
  | LifecycleDiagram;

// Diagram status
export type DiagramStatus = "ready" | "stale" | "error" | "generating" | "validating";

// Visualization config
export interface RoadmapVisualizationConfig {
  id: string;
  roadmapId: string;
  archifyEnabled: boolean;
  defaultDiagramType: DiagramType;
  allowedDiagramTypes: DiagramType[];
  aiGenerationEnabled: boolean;
  generationStrategy?: string;
  regenerationPolicy?: string;
  maxNodes?: number;
  promptVersion: string;
  generationVersion: string;
  createdAt: Date;
  updatedAt: Date;
}

// Stored diagram
export interface StoredArchifyDiagram {
  id: string;
  roadmapId: string;
  diagramType: DiagramType;
  sourceJson: ArchifyDiagram;
  sourceHash: string;
  roadmapVersion: string;
  generationVersion: string;
  promptVersion: string;
  status: DiagramStatus;
  errorMetadata?: unknown;
  renderedHtml?: string;
  generatedAt: Date;
  updatedAt: Date;
}

// Generation request/response
export interface GenerationRequest {
  roadmapId: string;
  diagramType: DiagramType;
  forceRegenerate?: boolean;
}

export interface GenerationResponse {
  diagramId: string;
  status: DiagramStatus;
  diagramType: DiagramType;
  generatedAt: string;
  isStale: boolean;
  viewerUrl: string;
  error?: string;
}