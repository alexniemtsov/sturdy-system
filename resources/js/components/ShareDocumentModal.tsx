import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Edit, Eye, Trash2 } from "lucide-react";

interface DocumentShare {
    id: number;
    user: {
        id: number;
        name: string;
        email: string;
    };
    permission: 'read' | 'write';
    shared_by: {
        id: number;
        name: string;
    };
    shared_at: string;
}

interface ShareDocumentModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    documentId: number;
    documentTitle: string;
}

export function ShareDocumentModal({ open, onOpenChange, documentId, documentTitle }: ShareDocumentModalProps) {
    const [email, setEmail] = React.useState("");
    const [permission, setPermission] = React.useState<'read' | 'write'>('write');
    const [shares, setShares] = React.useState<DocumentShare[]>([]);
    const [canShare, setCanShare] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(false);
    const [isSharing, setIsSharing] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const fetchShares = React.useCallback(async () => {
        if (!open) return;

        setIsLoading(true);
        try {
            const response = await fetch(`/api/documents/${documentId}/shares`);
            const data = await response.json();

            if (response.ok) {
                setShares(data.shares);
                setCanShare(data.can_share);
            } else {
                setError('Failed to load shares');
            }
        } catch (error) {
            setError('Failed to load shares');
        } finally {
            setIsLoading(false);
        }
    }, [documentId, open]);

    React.useEffect(() => {
        fetchShares();
    }, [fetchShares]);

    const handleShare = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;

        setIsSharing(true);
        setError(null);

        try {
            const response = await fetch(`/api/documents/${documentId}/shares`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
                body: JSON.stringify({
                    email: email.trim(),
                    permission,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setShares(prev => [...prev, data.share]);
                setEmail("");
                setPermission('write');
            } else {
                setError(data.message || 'Failed to share document');
            }
        } catch (error) {
            setError('Failed to share document');
        } finally {
            setIsSharing(false);
        }
    };

    const handleUpdatePermission = async (shareId: number, newPermission: 'read' | 'write') => {
        try {
            const response = await fetch(`/api/documents/${documentId}/shares/${shareId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
                body: JSON.stringify({
                    permission: newPermission,
                }),
            });

            if (response.ok) {
                setShares(prev => prev.map(share =>
                    share.id === shareId
                        ? { ...share, permission: newPermission }
                        : share
                ));
            }
        } catch (error) {
            console.error('Failed to update permission:', error);
        }
    };

    const handleRevokeAccess = async (shareId: number) => {
        try {
            const response = await fetch(`/api/documents/${documentId}/shares/${shareId}`, {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
            });

            if (response.ok) {
                setShares(prev => prev.filter(share => share.id !== shareId));
            }
        } catch (error) {
            console.error('Failed to revoke access:', error);
        }
    };

    const getCsrfToken = (): string => {
        const meta = document.querySelector('meta[name="csrf-token"]');
        return meta ? meta.getAttribute('content') || '' : '';
    };

    const getInitials = (name: string): string => {
        return name
            .split(' ')
            .map(part => part.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Share Document</DialogTitle>
                    <DialogDescription>
                        Share "{documentTitle}" with other users by entering their email address.
                    </DialogDescription>
                </DialogHeader>

                {canShare && (
                    <form onSubmit={handleShare} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email address</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="Enter user's email..."
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={isSharing}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Permission</Label>
                            <Select
                                value={permission}
                                onValueChange={(value: 'read' | 'write') => setPermission(value)}
                                disabled={isSharing}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="write">
                                        <div className="flex items-center gap-2">
                                            <Edit className="h-4 w-4" />
                                            Can edit
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="read">
                                        <div className="flex items-center gap-2">
                                            <Eye className="h-4 w-4" />
                                            Can view
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {error && (
                            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                                {error}
                            </div>
                        )}

                        <Button type="submit" disabled={!email.trim() || isSharing} className="w-full">
                            {isSharing ? 'Sharing...' : 'Share Document'}
                        </Button>
                    </form>
                )}

                {shares.length > 0 && (
                    <div className="space-y-4">
                        <div className="border-t pt-4">
                            <h4 className="font-medium text-sm mb-3">People with access</h4>
                            <div className="space-y-3">
                                {shares.map((share) => (
                                    <div key={share.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                                <div className="flex items-center justify-center bg-blue-500 text-white text-xs font-medium h-full w-full">
                                                    {getInitials(share.user.name)}
                                                </div>
                                            </Avatar>
                                            <div>
                                                <div className="font-medium text-sm">{share.user.name}</div>
                                                <div className="text-xs text-muted-foreground">{share.user.email}</div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {canShare ? (
                                                <Select
                                                    value={share.permission}
                                                    onValueChange={(value: 'read' | 'write') =>
                                                        handleUpdatePermission(share.id, value)
                                                    }
                                                >
                                                    <SelectTrigger className="w-auto">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="write">Can edit</SelectItem>
                                                        <SelectItem value="read">Can view</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            ) : (
                                                <Badge variant={share.permission === 'write' ? 'default' : 'secondary'}>
                                                    {share.permission === 'write' ? 'Can edit' : 'Can view'}
                                                </Badge>
                                            )}

                                            {canShare && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleRevokeAccess(share.id)}
                                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {isLoading && (
                    <div className="flex items-center justify-center py-4">
                        <div className="text-sm text-muted-foreground">Loading shares...</div>
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
