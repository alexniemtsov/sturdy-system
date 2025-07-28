import { useState, useEffect, useRef, useCallback } from 'react';
import { DocumentStateManager } from '@/lib/crdt/DocumentStateManager';
import { useDocumentSocket } from './useDocumentSocket';
import { CRDTOperation, DocumentContent } from '@/types/crdt';
import { ConnectionState } from '@/types/collaboration';

export interface UseCollaborativeEditorOptions {
    documentId: string;
    userId: string;
    initialContent?: string;
    onSave?: (content: DocumentContent) => void;
    onConnectionChange?: (state: ConnectionState) => void;
    debounceMs?: number;
}

export interface CollaborativeEditorState {
    content: string;
    isConnected: boolean;
    isSaving: boolean;
    canUndo: boolean;
    canRedo: boolean;
    connectionState: ConnectionState;
    cursors: Map<string, { position: number; selection?: { start: number; end: number } }>;
    presence: Map<string, { userName: string; online: boolean; lastSeen: number }>;
    operationQueue?: number;
    hasConflicts?: boolean;
}

export function useCollaborativeEditor(options: UseCollaborativeEditorOptions) {
    const [content, setContent] = useState(options.initialContent || '');
    const [isSaving, setIsSaving] = useState(false);
    const [cursors] = useState(new Map<string, { position: number; selection?: { start: number; end: number } }>());
    const [presence] = useState(new Map<string, { userName: string; online: boolean; lastSeen: number }>());

    const managerRef = useRef<DocumentStateManager | null>(null);
    const isApplyingRemoteOperation = useRef(false);
    const lastLocalPosition = useRef(0);

    const handleSave = useCallback(async (documentContent: DocumentContent) => {
        if (options.onSave) {
            setIsSaving(true);
            try {
                options.onSave(documentContent);
            } catch (error) {
                console.error('Failed to save document:', error);
            } finally {
                setIsSaving(false);
            }
        }
    }, [options.onSave]);

    const handleRemoteOperation = useCallback((operation: CRDTOperation) => {
        if (managerRef.current && !isApplyingRemoteOperation.current) {
            isApplyingRemoteOperation.current = true;

            const applied = managerRef.current.applyRemoteOperation(operation);
            if (applied) {
                const newContent = managerRef.current.getText();
                setContent(newContent);
            }

            isApplyingRemoteOperation.current = false;
        }
    }, []);

    const handlePresenceUpdate = useCallback((presenceData: any) => {
        presence.set(presenceData.userId, {
            userName: presenceData.userName || `User ${presenceData.userId}`,
            online: presenceData.online,
            lastSeen: presenceData.lastSeen || Date.now()
        });
    }, [presence]);

    const handleCursorUpdate = useCallback((cursorData: any) => {
        cursors.set(cursorData.userId, {
            position: cursorData.position,
            selection: cursorData.selection
        });
    }, [cursors]);

    const {
        connectionState,
        isConnected,
        broadcastOperation,
        broadcastCursor,
        broadcastPresence
    } = useDocumentSocket({
        documentId: options.documentId,
        userId: options.userId,
        onOperation: handleRemoteOperation,
        onPresence: handlePresenceUpdate,
        onCursor: handleCursorUpdate,
        onConnectionChange: options.onConnectionChange
    });

    const insertText = useCallback(async (text: string, position: number) => {
        if (!managerRef.current || isApplyingRemoteOperation.current) {
            return false;
        }

        try {
            const operation = managerRef.current.insertText(text, position);
            const newContent = managerRef.current.getText();
            setContent(newContent);

            if (isConnected) {
                await broadcastOperation(operation);
            }

            return true;
        } catch (error) {
            console.error('Failed to insert text:', error);
            return false;
        }
    }, [isConnected, broadcastOperation]);

    const deleteText = useCallback(async (position: number, length: number = 1) => {
        if (!managerRef.current || isApplyingRemoteOperation.current) {
            return false;
        }

        try {
            const operations = managerRef.current.deleteText(position, length);
            const newContent = managerRef.current.getText();
            setContent(newContent);

            if (isConnected && operations.length > 0) {
                for (const operation of operations) {
                    await broadcastOperation(operation);
                }
            }

            return true;
        } catch (error) {
            console.error('Failed to delete text:', error);
            return false;
        }
    }, [isConnected, broadcastOperation]);

    const updateCursor = useCallback(async (position: number, selection?: { start: number; end: number }) => {
        lastLocalPosition.current = position;

        if (isConnected) {
            await broadcastCursor(position, selection);
        }
    }, [isConnected, broadcastCursor]);

    const undo = useCallback(() => {
        if (managerRef.current) {
            const success = managerRef.current.undo();
            if (success) {
                const newContent = managerRef.current.getText();
                setContent(newContent);
            }
            return success;
        }
        return false;
    }, []);

    const redo = useCallback(() => {
        if (managerRef.current) {
            const success = managerRef.current.redo();
            if (success) {
                const newContent = managerRef.current.getText();
                setContent(newContent);
            }
            return success;
        }
        return false;
    }, []);

    const canUndo = managerRef.current?.canUndo() || false;
    const canRedo = managerRef.current?.canRedo() || false;

    const handleTextChange = useCallback(async (newText: string, changePosition?: number, changeLength?: number) => {
        if (isApplyingRemoteOperation.current || !managerRef.current) {
            return;
        }

        const currentText = managerRef.current.getText();

        if (newText === currentText) {
            return;
        }

        if (changePosition !== undefined && changeLength !== undefined) {
            if (changeLength > 0) {
                await deleteText(changePosition, changeLength);
            }

            const insertContent = newText.slice(changePosition, changePosition + (newText.length - currentText.length + changeLength));
            if (insertContent) {
                await insertText(insertContent, changePosition);
            }
        } else {
            const commonPrefix = getCommonPrefix(currentText, newText);
            const commonSuffix = getCommonSuffix(currentText.slice(commonPrefix), newText.slice(commonPrefix));

            const deleteStart = commonPrefix;
            const deleteLength = currentText.length - commonPrefix - commonSuffix;
            const insertContent = newText.slice(commonPrefix, newText.length - commonSuffix);

            if (deleteLength > 0) {
                await deleteText(deleteStart, deleteLength);
            }

            if (insertContent) {
                await insertText(insertContent, deleteStart);
            }
        }
    }, [deleteText, insertText]);

    useEffect(() => {
        const manager = new DocumentStateManager(options.userId, handleSave);
        managerRef.current = manager;

        if (options.initialContent) {
            manager.insertText(options.initialContent, 0);
            setContent(manager.getText());
        }

        return () => {
            manager.destroy();
            managerRef.current = null;
        };
    }, [options.userId, options.initialContent, handleSave]);

    // Broadcast presence on mount/unmount and connection state changes
    useEffect(() => {
        if (isConnected) {
            broadcastPresence(true);
        }

        return () => {
            if (isConnected) {
                broadcastPresence(false);
            }
        };
    }, [isConnected, broadcastPresence]);

    const state: CollaborativeEditorState = {
        content,
        isConnected,
        isSaving,
        canUndo,
        canRedo,
        connectionState,
        cursors,
        presence,
        operationQueue: managerRef.current?.getPendingOperationsCount() || 0,
        hasConflicts: managerRef.current?.hasConflicts() || false
    };

    return {
        state,
        actions: {
            insertText,
            deleteText,
            updateCursor,
            undo,
            redo,
            handleTextChange
        }
    };
}

function getCommonPrefix(str1: string, str2: string): number {
    let i = 0;
    while (i < str1.length && i < str2.length && str1[i] === str2[i]) {
        i++;
    }
    return i;
}

function getCommonSuffix(str1: string, str2: string): number {
    let i = 0;
    while (i < str1.length && i < str2.length && str1[str1.length - 1 - i] === str2[str2.length - 1 - i]) {
        i++;
    }
    return i;
}
