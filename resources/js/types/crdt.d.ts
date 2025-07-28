export interface RGANode {
  id: string;
  content: string;
  leftOrigin: string | null;
  rightOrigin: string | null;
  visible: boolean;
  timestamp: number;
  siteId: string;
}

export interface DocumentState {
  nodes: Map<string, RGANode>;
  sequence: string[];
  siteId: string;
  clock: number;
  version: number;
}

export interface InsertOperation {
  type: 'insert';
  nodeId: string;
  content: string;
  leftOrigin: string | null;
  rightOrigin: string | null;
  position: number;
  timestamp: number;
  siteId: string;
}

export interface DeleteOperation {
  type: 'delete';
  nodeId: string;
  timestamp: number;
  siteId: string;
}

export type CRDTOperation = InsertOperation | DeleteOperation;

export interface TextFormat {
  start: number;
  end: number;
  type: 'bold' | 'italic' | 'underline';
  id: string;
}

export interface DocumentContent {
  text: string;
  formats: TextFormat[];
}

export interface OperationResult {
  success: boolean;
  newSequence?: string[];
  error?: string;
}

export interface SerializedDocumentState {
  nodes: Array<[string, RGANode]>;
  sequence: string[];
  siteId: string;
  clock: number;
  version: number;
}