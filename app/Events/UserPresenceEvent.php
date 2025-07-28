<?php

namespace App\Events;

use App\Models\User;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class UserPresenceEvent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public string $userName;
    public bool $online;

    public function __construct(
        public string $documentId,
        public int $userId,
        array $payload
    ) {
        $this->online = $payload['online'] ?? true;

        $user = User::find($userId);
        $this->userName = $user ? $user->name : 'Unknown User';
    }

    /**
     * @return Channel[]
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('document.' . $this->documentId),
        ];
    }

    public function broadcastAs(): string
    {
        return 'UserPresenceEvent';
    }

    public function broadcastWith(): array
    {
        return [
            'userId' => $this->userId,
            'userName' => $this->userName,
            'online' => $this->online,
        ];
    }
}
