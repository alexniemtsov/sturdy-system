import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Bold, Italic, Underline, Undo, Redo, Wifi, WifiOff } from "lucide-react";
import { useCollaborativeEditor, UseCollaborativeEditorOptions } from "@/hooks/useCollaborativeEditor";
import { UserPresence } from "./UserPresence";
import { RemoteCursor } from "./RemoteCursor";

interface CollaborativeTextEditorProps extends Omit<UseCollaborativeEditorOptions, 'userId'> {
    className?: string;
    placeholder?: string;
    userId: string;
    userName?: string;
}

export function CollaborativeTextEditor({
    className,
    placeholder = "Start typing...",
    userId,
    userName = "Anonymous",
    ...editorOptions
}: CollaborativeTextEditorProps) {
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);
    const isComposing = React.useRef(false);
    const lastCursorPosition = React.useRef(0);

    const { state, actions } = useCollaborativeEditor({
        ...editorOptions,
        userId
    });

    const [formatting, setFormatting] = React.useState({
        bold: false,
        italic: false,
        underline: false
    });

    const handleInput = React.useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (isComposing.current) return;

        const newValue = e.target.value;
        const cursorPosition = e.target.selectionStart;

        actions.handleTextChange(newValue);
        actions.updateCursor(cursorPosition);

        lastCursorPosition.current = cursorPosition;
    }, [actions]);

    const handleCompositionStart = React.useCallback(() => {
        isComposing.current = true;
    }, []);

    const handleCompositionEnd = React.useCallback((e: React.CompositionEvent<HTMLTextAreaElement>) => {
        isComposing.current = false;
        const target = e.target as HTMLTextAreaElement;
        handleInput({ target } as React.ChangeEvent<HTMLTextAreaElement>);
    }, [handleInput]);

    const handleSelectionChange = React.useCallback(() => {
        if (!textareaRef.current) return;

        const start = textareaRef.current.selectionStart;
        const end = textareaRef.current.selectionEnd;

        if (start !== lastCursorPosition.current) {
            lastCursorPosition.current = start;
            actions.updateCursor(start, start !== end ? { start, end } : undefined);
        }
    }, [actions]);

    const handleKeyDown = React.useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'z':
                    e.preventDefault();
                    if (e.shiftKey) {
                        actions.redo();
                    } else {
                        actions.undo();
                    }
                    break;
                case 'y':
                    e.preventDefault();
                    actions.redo();
                    break;
                case 'b':
                    e.preventDefault();
                    toggleFormat('bold');
                    break;
                case 'i':
                    e.preventDefault();
                    toggleFormat('italic');
                    break;
                case 'u':
                    e.preventDefault();
                    toggleFormat('underline');
                    break;
            }
        }
    }, [actions]);

    const toggleFormat = React.useCallback((format: keyof typeof formatting) => {
        setFormatting(prev => ({
            ...prev,
            [format]: !prev[format]
        }));
    }, []);

    React.useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.addEventListener('select', handleSelectionChange);
            textarea.addEventListener('click', handleSelectionChange);

            return () => {
                textarea.removeEventListener('select', handleSelectionChange);
                textarea.removeEventListener('click', handleSelectionChange);
            };
        }
    }, [handleSelectionChange]);

    const connectionStatus = React.useMemo(() => {
        if (state.isConnected) {
            return { icon: Wifi, text: "Connected", variant: "default" as const };
        } else if (state.connectionState.reconnecting) {
            return { icon: WifiOff, text: "Reconnecting...", variant: "secondary" as const };
        } else {
            return { icon: WifiOff, text: "Offline", variant: "destructive" as const };
        }
    }, [state.isConnected, state.connectionState.reconnecting]);

    return (
        <div className={cn("border rounded-lg overflow-hidden bg-background", className)}>
            {/* Toolbar */}
            <div className="flex items-center justify-between p-2 border-b bg-muted/50">
                <div className="flex items-center gap-1">
                    <Button
                        variant={formatting.bold ? "default" : "ghost"}
                        size="sm"
                        onClick={() => toggleFormat('bold')}
                        className="h-8 w-8 p-0"
                        title="Bold (Ctrl+B)"
                    >
                        <Bold className="h-4 w-4" />
                    </Button>
                    <Button
                        variant={formatting.italic ? "default" : "ghost"}
                        size="sm"
                        onClick={() => toggleFormat('italic')}
                        className="h-8 w-8 p-0"
                        title="Italic (Ctrl+I)"
                    >
                        <Italic className="h-4 w-4" />
                    </Button>
                    <Button
                        variant={formatting.underline ? "default" : "ghost"}
                        size="sm"
                        onClick={() => toggleFormat('underline')}
                        className="h-8 w-8 p-0"
                        title="Underline (Ctrl+U)"
                    >
                        <Underline className="h-4 w-4" />
                    </Button>

                    <div className="w-px h-6 bg-border mx-2" />

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={actions.undo}
                        disabled={!state.canUndo}
                        className="h-8 w-8 p-0"
                        title="Undo (Ctrl+Z)"
                    >
                        <Undo className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={actions.redo}
                        disabled={!state.canRedo}
                        className="h-8 w-8 p-0"
                        title="Redo (Ctrl+Y)"
                    >
                        <Redo className="h-4 w-4" />
                    </Button>
                </div>

                <div className="flex items-center gap-3">
                    <UserPresence
                        users={state.presence}
                        cursors={state.cursors}
                    />

                    <div className="flex items-center gap-2">
                        {state.isSaving && (
                            <Badge variant="secondary" className="text-xs">
                                Saving...
                            </Badge>
                        )}

                        {state.operationQueue && state.operationQueue > 0 && (
                            <Badge variant="outline" className="text-xs">
                                {state.operationQueue} pending
                            </Badge>
                        )}

                        {state.hasConflicts && (
                            <Badge variant="destructive" className="text-xs">
                                Conflicts detected
                            </Badge>
                        )}

                        <Badge variant={connectionStatus.variant} className="text-xs">
                            <connectionStatus.icon className="h-3 w-3 mr-1" />
                            {connectionStatus.text}
                        </Badge>
                    </div>
                </div>
            </div>

            {/* Editor */}
            <div className="relative">
                <textarea
                    ref={textareaRef}
                    value={state.content}
                    onChange={handleInput}
                    onCompositionStart={handleCompositionStart}
                    onCompositionEnd={handleCompositionEnd}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className={cn(
                        "w-full min-h-[300px] p-4 resize-none border-none outline-none",
                        "font-mono text-sm leading-relaxed",
                        "focus:ring-0 focus:outline-none",
                        "placeholder:text-muted-foreground"
                    )}
                    style={{
                        fontWeight: formatting.bold ? 'bold' : 'normal',
                        fontStyle: formatting.italic ? 'italic' : 'normal',
                        textDecoration: formatting.underline ? 'underline' : 'none'
                    }}
                />

                {/* Remote cursors overlay */}
                {state.cursors.size > 0 && (
                    <div className="absolute inset-0 pointer-events-none">
                        {Array.from(state.cursors.entries()).map(([userId, cursor]) => (
                            <RemoteCursor
                                key={userId}
                                userId={userId}
                                position={cursor.position}
                                selection={cursor.selection}
                                textareaRef={textareaRef}
                                content={state.content}
                                userName={state.presence.get(userId)?.userName || `User ${userId}`}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Status bar */}
            <div className="flex items-center justify-between px-4 py-2 border-t bg-muted/20 text-xs text-muted-foreground">
                <div className="flex items-center gap-4">
                    <span>Characters: {state.content.length}</span>
                    <span>Lines: {state.content.split('\n').length}</span>
                </div>

                {state.connectionState.error && (
                    <span className="text-destructive">
                        {state.connectionState.error}
                    </span>
                )}
            </div>
        </div>
    );
}
