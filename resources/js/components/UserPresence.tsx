import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface UserPresenceProps {
    users: Map<string, { userName: string; online: boolean; lastSeen: number }>;
    cursors: Map<string, { position: number; selection?: { start: number; end: number } }>;
    className?: string;
}

const COLORS = [
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-red-500',
    'bg-orange-500'
];

export function UserPresence({ users, cursors, className }: UserPresenceProps) {
    const onlineUsers = Array.from(users.entries())
        .filter(([_, user]) => user.online)
        .slice(0, 8);

    if (onlineUsers.length === 0) {
        return null;
    }

    return (
        <TooltipProvider>
            <div className={cn("flex items-center gap-2", className)}>
                <div className="flex -space-x-2">
                    {onlineUsers.map(([userId, user], index) => {
                        const colorClass = COLORS[index % COLORS.length];
                        const hasCursor = cursors.has(userId);

                        return (
                            <Tooltip key={userId}>
                                <TooltipTrigger>
                                    <Avatar className={cn("h-8 w-8 border-2 border-background", colorClass)}>
                                        <div className="flex items-center justify-center text-white text-sm font-medium">
                                            {getInitials(user.userName)}
                                        </div>
                                        {hasCursor && (
                                            <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-400 rounded-full border border-background" />
                                        )}
                                    </Avatar>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <div className="flex flex-col gap-1">
                                        <span className="font-medium">{user.userName}</span>
                                        {hasCursor ? (
                                            <span className="text-green-500 text-xs">Actively editing</span>
                                        ) : (
                                            <span className="text-muted-foreground text-xs">Online</span>
                                        )}
                                    </div>
                                </TooltipContent>
                            </Tooltip>
                        );
                    })}
                </div>

                {onlineUsers.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                        {onlineUsers.length} online
                    </Badge>
                )}
            </div>
        </TooltipProvider>
    );
}

function getInitials(name: string): string {
    return name
        .split(' ')
        .map(part => part.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2);
}
