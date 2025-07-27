import CreateFileIcon from '@/components/ui/create-file-icon';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { FilePenLine } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Documents',
        href: '/dashboard',
    },
];

interface Document {
    id: number,
    title: string,
    storage_path: string
}

interface IndexProps {
    documents: Document[]
}

export default function Index({ documents }: IndexProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            {documents.map((doc: Document) => {
                return <div>
                    <p>{doc.id}</p>
                    <p>{doc.id}</p>
                    <p>{doc.id}</p></div>;
            })}
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">

                <div className="grid auto-rows-min gap-4 md:grid-cols-3 ">
                    <div className="cursor-pointer hover:bg-gray-800 flex flex-col items-center justify-center aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border text-center">
                        <FilePenLine className="w-16 h-16" size={48} color="#ffffff" absoluteStrokeWidth />
                        <span className="mt-1 font-semibold tracking-tight">CREATE</span>
                    </div>
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
