import {
  RGANode,
  DocumentState,
  InsertOperation,
  DeleteOperation,
  CRDTOperation,
  OperationResult,
  SerializedDocumentState
} from '@/types/crdt';
import { generateSiteId, parseClockFromNodeId } from '@/lib/utils/idGenerator';
import { extractTextFromNodes, findNodeAtPosition } from '@/lib/utils/textHelpers';
import { createInsertOperation, createDeleteOperation, compareOperations } from './operations';

export class RGA {
  private state: DocumentState;
  private operationQueue: CRDTOperation[] = [];

  constructor(siteId?: string) {
    this.state = {
      nodes: new Map<string, RGANode>(),
      sequence: [],
      siteId: siteId || generateSiteId(),
      clock: 0,
      version: 0
    };
  }

  getText(): string {
    return extractTextFromNodes(this.state.nodes, this.state.sequence);
  }

  getState(): DocumentState {
    return {
      ...this.state,
      nodes: new Map(this.state.nodes)
    };
  }

  insert(content: string, position: number): InsertOperation {
    const { leftOrigin, rightOrigin } = this.findOrigins(position);

    this.state.clock++;
    const operation = createInsertOperation(
      content,
      position,
      leftOrigin,
      rightOrigin,
      this.state.siteId,
      this.state.clock
    );

    this.applyInsert(operation);
    return operation;
  }

  delete(position: number, length: number = 1): DeleteOperation[] {
    const operations: DeleteOperation[] = [];
    const currentText = this.getText();

    if (position < 0 || position >= currentText.length) {
      return operations;
    }

    const endPosition = Math.min(position + length, currentText.length);

    for (let i = position; i < endPosition; i++) {
      const { nodeId } = findNodeAtPosition(this.state.sequence, this.state.nodes, i);
      if (nodeId) {
        const operation = createDeleteOperation(nodeId, this.state.siteId);
        this.applyDelete(operation);
        operations.push(operation);
      }
    }

    return operations;
  }

  applyOperation(operation: CRDTOperation): OperationResult {
    try {
      if (operation.type === 'insert') {
        return this.applyInsert(operation);
      } else if (operation.type === 'delete') {
        return this.applyDelete(operation);
      }

      return { success: false, error: 'Unknown operation type' };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  private applyInsert(operation: InsertOperation): OperationResult {
    const node: RGANode = {
      id: operation.nodeId,
      content: operation.content,
      leftOrigin: operation.leftOrigin,
      rightOrigin: operation.rightOrigin,
      visible: true,
      timestamp: operation.timestamp,
      siteId: operation.siteId
    };

    this.state.nodes.set(node.id, node);

    const insertIndex = this.findInsertIndex(node);
    this.state.sequence.splice(insertIndex, 0, node.id);

    this.updateClock(operation);
    this.state.version++;

    return {
      success: true,
      newSequence: [...this.state.sequence]
    };
  }

  private applyDelete(operation: DeleteOperation): OperationResult {
    const node = this.state.nodes.get(operation.nodeId);
    if (!node) {
      return { success: false, error: 'Node not found' };
    }

    node.visible = false;
    this.updateClock(operation);
    this.state.version++;

    return {
      success: true,
      newSequence: [...this.state.sequence]
    };
  }

  private findOrigins(position: number): { leftOrigin: string | null; rightOrigin: string | null } {
    if (this.state.sequence.length === 0) {
      return { leftOrigin: null, rightOrigin: null };
    }

    let currentPos = 0;
    let leftOrigin: string | null = null;
    let rightOrigin: string | null = null;

    for (const nodeId of this.state.sequence) {
      const node = this.state.nodes.get(nodeId);
      if (!node || !node.visible) continue;

      if (currentPos >= position) {
        rightOrigin = nodeId;
        break;
      }

      if (currentPos + node.content.length <= position) {
        leftOrigin = nodeId;
      } else {
        rightOrigin = nodeId;
        break;
      }

      currentPos += node.content.length;
    }

    return { leftOrigin, rightOrigin };
  }

  private findInsertIndex(node: RGANode): number {
    if (this.state.sequence.length === 0) {
      return 0;
    }

    let insertIndex = this.state.sequence.length;

    for (let i = 0; i < this.state.sequence.length; i++) {
      const currentNodeId = this.state.sequence[i];
      const currentNode = this.state.nodes.get(currentNodeId);

      if (!currentNode) continue;

      if (this.shouldInsertBefore(node, currentNode)) {
        insertIndex = i;
        break;
      }
    }

    return insertIndex;
  }

  private shouldInsertBefore(newNode: RGANode, existingNode: RGANode): boolean {
    if (newNode.timestamp < existingNode.timestamp) {
      return true;
    }

    if (newNode.timestamp > existingNode.timestamp) {
      return false;
    }

    return newNode.siteId < existingNode.siteId;
  }

  private updateClock(operation: CRDTOperation): void {
    const operationClock = parseClockFromNodeId(operation.nodeId);
    this.state.clock = Math.max(this.state.clock, operationClock);
  }

  serialize(): SerializedDocumentState {
    return {
      nodes: Array.from(this.state.nodes.entries()),
      sequence: [...this.state.sequence],
      siteId: this.state.siteId,
      clock: this.state.clock,
      version: this.state.version
    };
  }

  static deserialize(serialized: SerializedDocumentState): RGA {
    const rga = new RGA(serialized.siteId);
    rga.state = {
      nodes: new Map(serialized.nodes),
      sequence: [...serialized.sequence],
      siteId: serialized.siteId,
      clock: serialized.clock,
      version: serialized.version
    };
    return rga;
  }

  merge(otherRGA: RGA): void {
    const otherState = otherRGA.getState();
    const allOperations: CRDTOperation[] = [];

    for (const [nodeId, node] of otherState.nodes) {
      if (!this.state.nodes.has(nodeId)) {
        if (node.visible) {
          allOperations.push({
            type: 'insert',
            nodeId: node.id,
            content: node.content,
            leftOrigin: node.leftOrigin,
            rightOrigin: node.rightOrigin,
            position: 0,
            timestamp: node.timestamp,
            siteId: node.siteId
          });
        } else {
          allOperations.push({
            type: 'delete',
            nodeId: node.id,
            timestamp: node.timestamp,
            siteId: node.siteId
          });
        }
      }
    }

    allOperations.sort(compareOperations);

    for (const operation of allOperations) {
      this.applyOperation(operation);
    }
  }
}
