import { CRDTOperation, InsertOperation, DeleteOperation } from '@/types/crdt';
import { generateNodeId } from '@/lib/utils/idGenerator';

export function createInsertOperation(
  content: string,
  position: number,
  leftOrigin: string | null,
  rightOrigin: string | null,
  siteId: string,
  clock: number
): InsertOperation {
  return {
    type: 'insert',
    nodeId: generateNodeId(siteId, clock),
    content,
    leftOrigin,
    rightOrigin,
    position,
    timestamp: Date.now(),
    siteId
  };
}

export function createDeleteOperation(
  nodeId: string,
  siteId: string
): DeleteOperation {
  return {
    type: 'delete',
    nodeId,
    timestamp: Date.now(),
    siteId
  };
}

export function compareOperations(op1: CRDTOperation, op2: CRDTOperation): number {
  if (op1.timestamp !== op2.timestamp) {
    return op1.timestamp - op2.timestamp;
  }

  if (op1.siteId !== op2.siteId) {
    return op1.siteId.localeCompare(op2.siteId);
  }

  return 0;
}

export function isOperationValid(operation: CRDTOperation): boolean {
  if (!operation.nodeId || !operation.siteId || !operation.timestamp) {
    return false;
  }

  if (operation.type === 'insert') {
    const insertOp = operation as InsertOperation;
    return insertOp.position >= 0;
  }

  return operation.type === 'delete';
}

export function serializeOperation(operation: CRDTOperation): string {
  return JSON.stringify(operation);
}

export function deserializeOperation(serialized: string): CRDTOperation | null {
  try {
    const operation = JSON.parse(serialized);
    return isOperationValid(operation) ? operation : null;
  } catch {
    return null;
  }
}
