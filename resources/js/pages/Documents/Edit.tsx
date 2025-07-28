import * as React from "react";
import { TextEditor } from "@/components/TextEditor";
import { BreadcrumbItem, Document } from "@/types";
import { router } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Documents',
        href: '/documents',
    },
];

interface EditProps {
    document: Document;
}

export default function Edit({ document }: EditProps) {
    const [title, setTitle] = React.useState(document.title);
    const [content, setContent] = React.useState("");
    const [isSaving, setIsSaving] = React.useState(false);

    const saveDocument = React.useCallback(async (updates: { title?: string; content?: string }) => {
        if (isSaving) return;
        
        setIsSaving(true);
        try {
            await router.patch(`/documents/${document.id}`, updates, {
                preserveState: true,
                preserveScroll: true,
            });
        } catch (error) {
            console.error('Failed to save document:', error);
        } finally {
            setIsSaving(false);
        }
    }, [document.id, isSaving]);

    const handleTitleChange = React.useCallback((newTitle: string) => {
        setTitle(newTitle);
        saveDocument({ title: newTitle });
    }, [saveDocument]);

    const handleContentChange = React.useCallback((newContent: string) => {
        setContent(newContent);
        saveDocument({ content: newContent });
    }, [saveDocument]);

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="flex items-center gap-4 mb-6">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.visit('/documents')}
                    className="flex items-center gap-2"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Documents
                </Button>
                
                <div className="flex-1">
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => handleTitleChange(e.target.value)}
                        className="text-2xl font-bold bg-transparent border-none outline-none w-full focus:ring-0"
                        placeholder="Untitled Document"
                    />
                </div>
                
                {isSaving && (
                    <div className="text-sm text-muted-foreground">
                        Saving...
                    </div>
                )}
            </div>

            <TextEditor
                defaultValue={content}
                onChange={handleContentChange}
                placeholder="Start writing your document..."
                className="min-h-[600px]"
            />
        </div>
    );
}
