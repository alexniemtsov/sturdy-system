import { CRDTOperation } from './crdt';

export interface WebSocketMessage {
  type: 'operation' | 'presence' | 'cursor' | 'connection';
  payload: any;
  documentId: string;
  userId: string;
  timestamp: number;
}

export interface OperationMessage extends WebSocketMessage {
  type: 'operation';
  payload: CRDTOperation;
}

export interface PresenceMessage extends WebSocketMessage {
  type: 'presence';
  payload: {
    userId: string;
    userName: string;
    online: boolean;
    lastSeen: number;
  };
}

export interface CursorMessage extends WebSocketMessage {
  type: 'cursor';
  payload: {
    userId: string;
    position: number;
    selection?: {
      start: number;
      end: number;
    };
  };
}

export interface ConnectionState {
  connected: boolean;
  reconnecting: boolean;
  lastConnected: number | null;
  error: string | null;
}

export interface CollaborationHookOptions {
  documentId: string;
  userId: string;
  onOperation?: (operation: CRDTOperation) => void;
  onPresence?: (presence: PresenceMessage['payload']) => void;
  onCursor?: (cursor: CursorMessage['payload']) => void;
  onConnectionChange?: (state: ConnectionState) => void;
}