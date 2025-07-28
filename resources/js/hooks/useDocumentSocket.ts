import { useState, useEffect, useRef, useCallback } from 'react';
import { useEcho } from '@laravel/echo-react';
import {
    ConnectionState,
    CollaborationHookOptions
} from '@/types/collaboration';
import { CRDTOperation } from '@/types/crdt';

export function useDocumentSocket(options: CollaborationHookOptions) {
    const [connectionState, setConnectionState] = useState<ConnectionState>({
        connected: false,
        reconnecting: false,
        lastConnected: null,
        error: null
    });

    const mountedRef = useRef(true);

    // Add debugging for channel subscription
    useEffect(() => {
        console.log('Setting up Echo listeners for document:', options.documentId);
        console.log('User ID:', options.userId);
    }, [options.documentId, options.userId]);

    useEcho(
        `document.${options.documentId}`,
        'DocumentOperationEvent',
        (event: { operation: CRDTOperation; userId: string }) => {
            console.log('Received DocumentOperationEvent:', event);
            if (String(event.userId) !== String(options.userId) && mountedRef.current) {
                console.log('Processing operation for user:', event.userId);
                options.onOperation?.(event.operation);
            } else {
                console.log('Filtering out operation - same user or unmounted', {
                    eventUserId: event.userId,
                    optionsUserId: options.userId,
                    mounted: mountedRef.current
                });
            }
        }
    );

    useEcho(
        `document.${options.documentId}`,
        'UserPresenceEvent',
        (event: { userId: string; userName: string; online: boolean }) => {
            console.log('Received UserPresenceEvent:', event);
            if (mountedRef.current) {
                console.log('Processing presence for user:', event.userId);
                options.onPresence?.({
                    userId: event.userId,
                    userName: event.userName,
                    online: event.online,
                    lastSeen: Date.now()
                });
            }
        }
    );

    useEcho(
        `document.${options.documentId}`,
        'CursorPositionEvent',
        (event: { userId: string; position: number; selection?: { start: number; end: number } }) => {
            console.log('Received CursorPositionEvent:', event);
            if (String(event.userId) !== String(options.userId) && mountedRef.current) {
                console.log('Processing cursor for user:', event.userId);
                options.onCursor?.({
                    userId: event.userId,
                    position: event.position,
                    selection: event.selection
                });
            } else {
                console.log('Filtering out cursor - same user or unmounted', {
                    eventUserId: event.userId,
                    optionsUserId: options.userId,
                    mounted: mountedRef.current
                });
            }
        }
    );

    const getCsrfToken = useCallback((): string => {
        const meta = document.querySelector('meta[name="csrf-token"]');
        return meta ? meta.getAttribute('content') || '' : '';
    }, []);

    const broadcastOperation = useCallback(async (operation: CRDTOperation) => {
        try {
            await fetch(`/api/documents/${options.documentId}/broadcast`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken()
                },
                body: JSON.stringify({
                    type: 'operation',
                    payload: operation,
                    userId: options.userId
                })
            });
            return true;
        } catch (error) {
            console.warn('Failed to broadcast operation (offline mode):', error);
            return false;
        }
    }, [options.documentId, options.userId, getCsrfToken]);

    const broadcastCursor = useCallback(async (position: number, selection?: { start: number; end: number }) => {
        try {
            await fetch(`/api/documents/${options.documentId}/broadcast`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken()
                },
                body: JSON.stringify({
                    type: 'cursor',
                    payload: { position, selection },
                    userId: options.userId
                })
            });
            return true;
        } catch (error) {
            console.warn('Failed to broadcast cursor (offline mode):', error);
            return false;
        }
    }, [options.documentId, options.userId, getCsrfToken]);

    const broadcastPresence = useCallback(async (online: boolean = true) => {
        try {
            await fetch(`/api/documents/${options.documentId}/broadcast`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken()
                },
                body: JSON.stringify({
                    type: 'presence',
                    payload: { online },
                    userId: options.userId
                })
            });
            return true;
        } catch (error) {
            console.warn('Failed to broadcast presence (offline mode):', error);
            return false;
        }
    }, [options.documentId, options.userId, getCsrfToken]);

    // Simple connection state setup
    useEffect(() => {
        mountedRef.current = true;

        console.log('Setting up WebSocket listeners for document:', options.documentId);
        console.log('User ID:', options.userId);

        setConnectionState({
            connected: true,
            reconnecting: false,
            lastConnected: Date.now(),
            error: null
        });

        return () => {
            mountedRef.current = false;
        };
    }, [options.documentId, options.userId]);

    useEffect(() => {
        const handleBeforeUnload = () => {
            broadcastPresence(false);
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                broadcastPresence(true);
            } else {
                broadcastPresence(false);
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [broadcastPresence]);

    return {
        connectionState,
        isConnected: connectionState.connected,
        broadcastOperation,
        broadcastCursor,
        broadcastPresence,
    };
}
