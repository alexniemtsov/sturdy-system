<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('document.{id}', function ($user, $id) {
    $document = \App\Models\Document::find($id);
    return $document &&
        ($document->user_id === $user->id
            ||
            $document->shares()->where('user_id', $user->id)->exists());
});
