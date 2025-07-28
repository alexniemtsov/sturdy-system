<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DocumentOperationEvent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public string $documentId,
        public int $userId,
        public array $operation) {}

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
        return 'DocumentOperationEvent';
    }

    public function broadcastWith(): array
    {
        return [
            'operation' => $this->operation,
            'userId' => $this->userId,
        ];
    }
}
