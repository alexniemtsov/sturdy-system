import * as React from "react";
import { CollaborativeTextEditor } from "@/components/CollaborativeTextEditor";
import { ShareDocumentModal } from "@/components/ShareDocumentModal";
import { BreadcrumbItem, Document, User } from "@/types";
import { DocumentContent } from "@/types/crdt";
import { router, usePage } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Share } from "lucide-react";

interface EditProps {
    document: Document;
    initialContent?: string;
}

export default function Edit({ document, initialContent = "" }: EditProps) {
    const { props } = usePage();
    const user = props.auth?.user as User;
    console.log('user', user);
    const [title, setTitle] = React.useState(document.title);
    const [isSaving, setIsSaving] = React.useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = React.useState(false);

    const saveDocument = React.useCallback(async (updates: { title?: string; content?: string }) => {
        if (isSaving) return;

        setIsSaving(true);
        try {
            router.patch(`/documents/${document.id}`, updates, {
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

    const handleContentSave = React.useCallback(async (documentContent: DocumentContent) => {
        await saveDocument({ content: documentContent.text });
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

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsShareModalOpen(true)}
                        className="flex items-center gap-2"
                    >
                        <Share className="h-4 w-4" />
                        Share
                    </Button>

                    {isSaving && (
                        <div className="text-sm text-muted-foreground">
                            Saving...
                        </div>
                    )}
                </div>
            </div>

            <CollaborativeTextEditor
                documentId={document.id.toString()}
                userId={user.id.toString()}
                userName={user.name}
                initialContent={initialContent}
                onSave={handleContentSave}
                placeholder="Start writing your document..."
                className="min-h-[600px]"
            />

            <ShareDocumentModal
                open={isShareModalOpen}
                onOpenChange={setIsShareModalOpen}
                documentId={document.id}
                documentTitle={document.title}
            />
        </div>
    );
}
