<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CursorPositionEvent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int $position;
    public int|null $selection;

    public function __construct(
        public string $documentId,
        public int $userId,
        array $payload
    ) {
        $this->position = $payload['position'] ?? 0;
        $this->selection = $payload['selection'] ?? null;
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
        return 'CursorPositionEvent';
    }

    public function broadcastWith(): array
    {
        return [
            'userId' => $this->userId,
            'position' => $this->position,
            'selection' => $this->selection,
        ];
    }
}
