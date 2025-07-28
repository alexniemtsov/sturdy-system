import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, Document } from '@/types';
import { Head, router } from '@inertiajs/react';
import { FilePenLine, FilePlus } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Documents',
        href: '/documents',
    },
];

interface IndexProps {
    documents: Document[]
}

export default function Index({ documents }: IndexProps) {
    const handleCreateDocument = () => {
        router.post('/documents');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Documents" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
                <div className="grid auto-rows-min gap-4 md:grid-cols-3 ">
                    <div
                        onClick={handleCreateDocument}
                        className="cursor-pointer hover:bg-gray-800 flex flex-col items-center justify-center aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border text-center transition-colors"
                    >
                        <FilePlus className="w-16 h-16" size={48} color="#ffffff" absoluteStrokeWidth />
                    </div>

                    {documents.map((doc: Document) => (
                        <div
                            key={doc.id}
                            onClick={() => router.visit(`/documents/${doc.id}/edit`)}
                            className="cursor-pointer hover:bg-gray-800 flex flex-col items-center justify-center aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border text-center transition-colors p-4"
                        >
                            <FilePenLine className="w-12 h-12 mb-2" color="#ffffff" />
                            <span className="font-semibold tracking-tight truncate w-full">{doc.title}</span>
                            <span className="text-sm text-muted-foreground mt-1">
                                {new Date(doc.updated_at).toLocaleDateString()}
                            </span>
                        </div>
                    ))}
                </div>
                {/* <div className="grid auto-rows-min gap-4 md:grid-cols-3"> */}
                {/*     <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border"> */}
                {/*         <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" /> */}
                {/*     </div> */}
                {/*     <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border"> */}
                {/*         <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" /> */}
                {/*     </div> */}
                {/* </div> */}
                {/* <div className="relative min-h-[100vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 md:min-h-min dark:border-sidebar-border"> */}
                {/*     <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" /> */}
                {/* </div> */}
            </div>
        </AppLayout>
    );
}
