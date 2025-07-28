<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $document_id
 * @property int $user_id
 * @property int $shared_by
 * @property string $permission
 * @property \Illuminate\Support\Carbon $shared_at
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\Document $document
 * @property-read \App\Models\User $user
 * @property-read \App\Models\User $sharedBy
 */
class DocumentShare extends Model
{
    use HasFactory;

    protected $fillable = [
        'document_id',
        'user_id',
        'shared_by',
        'permission',
        'shared_at',
    ];

    protected $casts = [
        'shared_at' => 'datetime',
    ];

    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function sharedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'shared_by');
    }

    public function canWrite(): bool
    {
        return $this->permission === 'write';
    }

    public function canRead(): bool
    {
        return in_array($this->permission, ['read', 'write']);
    }
}