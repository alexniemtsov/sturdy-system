<?php

namespace App\Http\Controllers;

use App\Events\CursorPositionEvent;
use App\Events\DocumentOperationEvent;
use App\Events\UserPresenceEvent;
use App\Models\Document;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\JsonResponse;

class DocumentController extends AuthorizedController
{
    public function index(): Response
    {
        $userId = $this->auth()->id();

        $ownedDocs = Document::where('user_id', $userId)->get();

        $sharedDocs = Document::whereHas('shares', function($query) use ($userId) {
            $query->where('user_id', $userId);
        })->with(['user:id,name', 'shares' => function($query) use ($userId) {
            $query->where('user_id', $userId);
        }])->get();

        return Inertia::render('Documents/Index', [
            'ownedDocuments' => $ownedDocs,
            'sharedDocuments' => $sharedDocs->map(function($doc) {
                return [
                    'id' => $doc->id,
                    'title' => $doc->title,
                    'created_at' => $doc->created_at,
                    'updated_at' => $doc->updated_at,
                    'owner' => $doc->user,
                    'permission' => $doc->shares->first()?->permission,
                ];
            })
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $userId = $this->auth()->id();
        $uuid = Str::uuid();
        $storagePath = "documents/user-{$userId}/{$uuid}.json";

        $document = Document::create([
            'title' => 'Untitled Document',
            'storage_path' => $storagePath,
            'user_id' => $userId,
        ]);

        return redirect()->route('documents.edit', $document);
    }

    public function show(Document $document): RedirectResponse
    {
        return redirect()->route('documents.edit', $document);
    }

    public function edit(Document $document): Response
    {
        $this->authorize('view', $document);

        return Inertia::render('Documents/Edit', [
            'document' => $document
        ]);
    }

    /**
     * Called frequently for autosave
     */
    public function update(Request $request, Document $document): Response
    {
        $this->authorize('update', $document);

        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'content' => 'sometimes|required|string',
        ]);

        if (isset($validated['title'])) {
            $document->update(['title' => $validated['title']]);
        }

        if (isset($validated['content'])) {
            // Store content to S3 using the storage_path
            // TODO: Implement actual S3 storage
        }
        return $this->edit($document);
    }

    public function destroy(Document $document): RedirectResponse
    {
        $this->authorize('delete', $document);

        // TODO: Delete file from S3 using storage_path
        $document->delete();

        return redirect()->route('documents.index');
    }

    public function broadcast(Request $request, Document $document): JsonResponse
    {
        $this->authorize('view', $document);

        $validated = $request->validate([
            'type' => 'required|string|in:operation,cursor,presence',
            'payload' => 'required',
            'userId' => 'required|integer'
        ]);

        $eventClass = match($validated['type']) {
            'operation' => DocumentOperationEvent::class,
            'cursor' => CursorPositionEvent::class,
            'presence' => UserPresenceEvent::class,
        };

        \Log::info('Broadcasting event', [
            'type' => $validated['type'],
            'document_id' => $document->id,
            'user_id' => $validated['userId'],
            'payload' => $validated['payload']
        ]);

        broadcast(new $eventClass(
            $document->id,
            $validated['userId'],
            $validated['payload']
            ))->toOthers();

        \Log::info('Event roadcasted successfully');

        return response()->json(['success' => true]);
    }
}
