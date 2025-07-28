import { RGA } from './RGA';
import { CRDTOperation, DocumentContent, SerializedDocumentState } from '@/types/crdt';

interface UndoRedoState {
  operations: CRDTOperation[];
  text: string;
  timestamp: number;
}

export class DocumentStateManager {
  private rga: RGA;
  private pendingOperations: CRDTOperation[] = [];
  private acknowledgedOperations = new Set<string>();
  private conflictedOperations: CRDTOperation[] = [];
  private undoStack: UndoRedoState[] = [];
  private redoStack: UndoRedoState[] = [];
  private maxHistorySize = 100;
  private saveTimeout: NodeJS.Timeout | null = null;
  private saveCallback?: (content: DocumentContent) => void;

  constructor(siteId?: string, saveCallback?: (content: DocumentContent) => void) {
    this.rga = new RGA(siteId);
    this.saveCallback = saveCallback;
  }

  getText(): string {
    return this.rga.getText();
  }

  getContent(): DocumentContent {
    return {
      text: this.rga.getText(),
      formats: []
    };
  }

  getState(): SerializedDocumentState {
    return this.rga.serialize();
  }

  setState(serializedState: SerializedDocumentState): void {
    this.rga = RGA.deserialize(serializedState);
    this.clearHistory();
    this.scheduleSave();
  }

  insertText(content: string, position: number): CRDTOperation {
    this.saveStateToHistory();
    
    const operation = this.rga.insert(content, position);
    this.pendingOperations.push(operation);
    
    this.scheduleSave();
    return operation;
  }

  deleteText(position: number, length: number = 1): CRDTOperation[] {
    this.saveStateToHistory();
    
    const operations = this.rga.delete(position, length);
    this.pendingOperations.push(...operations);
    
    this.scheduleSave();
    return operations;
  }

  applyRemoteOperation(operation: CRDTOperation): boolean {
    const operationId = this.getOperationId(operation);
    
    if (this.acknowledgedOperations.has(operationId)) {
      return false;
    }

    const result = this.rga.applyOperation(operation);
    if (result.success) {
      this.acknowledgedOperations.add(operationId);
      this.scheduleSave();
      return true;
    }
    
    return false;
  }

  getPendingOperations(): CRDTOperation[] {
    return [...this.pendingOperations];
  }

  acknowledgeOperation(operation: CRDTOperation): void {
    const operationId = this.getOperationId(operation);
    this.acknowledgedOperations.add(operationId);
    
    const index = this.pendingOperations.findIndex(op => 
      this.getOperationId(op) === operationId
    );
    
    if (index >= 0) {
      this.pendingOperations.splice(index, 1);
    }
  }

  undo(): boolean {
    if (this.undoStack.length === 0) {
      return false;
    }

    const currentState: UndoRedoState = {
      operations: [...this.pendingOperations],
      text: this.getText(),
      timestamp: Date.now()
    };
    
    this.redoStack.push(currentState);
    
    const previousState = this.undoStack.pop()!;
    this.restoreState(previousState);
    
    this.scheduleSave();
    return true;
  }

  redo(): boolean {
    if (this.redoStack.length === 0) {
      return false;
    }

    const currentState: UndoRedoState = {
      operations: [...this.pendingOperations],
      text: this.getText(),
      timestamp: Date.now()
    };
    
    this.undoStack.push(currentState);
    
    const nextState = this.redoStack.pop()!;
    this.restoreState(nextState);
    
    this.scheduleSave();
    return true;
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  merge(otherManager: DocumentStateManager): void {
    this.rga.merge(otherManager.rga);
    this.scheduleSave();
  }

  private saveStateToHistory(): void {
    const state: UndoRedoState = {
      operations: [...this.pendingOperations],
      text: this.getText(),
      timestamp: Date.now()
    };

    this.undoStack.push(state);
    
    if (this.undoStack.length > this.maxHistorySize) {
      this.undoStack.shift();
    }
    
    this.redoStack = [];
  }

  private restoreState(state: UndoRedoState): void {
    this.clearHistory();
    
    for (const operation of state.operations) {
      this.rga.applyOperation(operation);
    }
    
    this.pendingOperations = [...state.operations];
  }

  private clearHistory(): void {
    this.undoStack = [];
    this.redoStack = [];
  }

  private getOperationId(operation: CRDTOperation): string {
    return `${operation.type}_${operation.nodeId}_${operation.timestamp}`;
  }

  private scheduleSave(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    this.saveTimeout = setTimeout(() => {
      if (this.saveCallback) {
        this.saveCallback(this.getContent());
      }
      this.saveTimeout = null;
    }, 500);
  }

  public getPendingOperationsCount(): number {
    return this.pendingOperations.length;
  }

  public hasConflicts(): boolean {
    return this.conflictedOperations.length > 0;
  }

  destroy(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
    
    this.pendingOperations = [];
    this.acknowledgedOperations.clear();
    this.clearHistory();
  }

  getDebugInfo(): {
    siteId: string;
    nodeCount: number;
    sequenceLength: number;
    pendingOperations: number;
    acknowledgedOperations: number;
    undoStackSize: number;
    redoStackSize: number;
  } {
    const state = this.rga.getState();
    
    return {
      siteId: state.siteId,
      nodeCount: state.nodes.size,
      sequenceLength: state.sequence.length,
      pendingOperations: this.pendingOperations.length,
      acknowledgedOperations: this.acknowledgedOperations.size,
      undoStackSize: this.undoStack.length,
      redoStackSize: this.redoStack.length
    };
  }
}