import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, Document } from '@/types';
import { Head, router } from '@inertiajs/react';
import { FilePenLine, FilePlus, Users, Eye, Edit } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Documents',
        href: '/documents',
    },
];

interface SharedDocument {
    id: number;
    title: string;
    created_at: string;
    updated_at: string;
    owner: {
        id: number;
        name: string;
    };
    permission: 'read' | 'write';
}

interface IndexProps {
    ownedDocuments?: Document[];
    sharedDocuments?: SharedDocument[];
}

export default function Index({ ownedDocuments = [], sharedDocuments = [] }: IndexProps) {
    const handleCreateDocument = () => {
        router.post('/documents');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Documents" />
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4 overflow-x-auto">
                {/* My Documents Section */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold">My Documents</h2>
                    <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                        <div
                            onClick={handleCreateDocument}
                            className="cursor-pointer hover:bg-gray-800 flex flex-col items-center justify-center aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border text-center transition-colors"
                        >
                            <FilePlus className="w-16 h-16" size={48} color="#ffffff" absoluteStrokeWidth />
                            <span className="text-sm text-muted-foreground mt-2">Create New Document</span>
                        </div>

                        {ownedDocuments.map((doc: Document) => (
                            <div
                                key={doc.id}
                                onClick={() => router.visit(`/documents/${doc.id}/edit`)}
                                className="cursor-pointer hover:bg-gray-800 flex flex-col items-center justify-center aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border text-center transition-colors p-4 relative"
                            >
                                <FilePenLine className="w-12 h-12 mb-2" color="#ffffff" />
                                <span className="font-semibold tracking-tight truncate w-full">{doc.title}</span>
                                <span className="text-sm text-muted-foreground mt-1">
                                    {new Date(doc.updated_at).toLocaleDateString()}
                                </span>
                                <Badge variant="secondary" className="absolute top-2 right-2 text-xs">
                                    Owner
                                </Badge>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Shared Documents Section */}
                {sharedDocuments.length > 0 && (
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <Users className="w-5 h-5" />
                            Shared with Me
                        </h2>
                        <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                            {sharedDocuments.map((doc: SharedDocument) => (
                                <div
                                    key={doc.id}
                                    onClick={() => router.visit(`/documents/${doc.id}/edit`)}
                                    className="cursor-pointer hover:bg-gray-800 flex flex-col items-center justify-center aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border text-center transition-colors p-4 relative"
                                >
                                    <FilePenLine className="w-12 h-12 mb-2" color="#ffffff" />
                                    <span className="font-semibold tracking-tight truncate w-full">{doc.title}</span>
                                    <span className="text-xs text-muted-foreground">
                                        by {doc.owner.name}
                                    </span>
                                    <span className="text-sm text-muted-foreground mt-1">
                                        {new Date(doc.updated_at).toLocaleDateString()}
                                    </span>
                                    <Badge 
                                        variant={doc.permission === 'write' ? 'default' : 'secondary'} 
                                        className="absolute top-2 right-2 text-xs flex items-center gap-1"
                                    >
                                        {doc.permission === 'write' ? (
                                            <>
                                                <Edit className="w-3 h-3" />
                                                Can Edit
                                            </>
                                        ) : (
                                            <>
                                                <Eye className="w-3 h-3" />
                                                Can View
                                            </>
                                        )}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
