<?php

namespace App\Http\Controllers;

use App\Models\Document;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class DocumentController extends AuthorizedController
{
    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        $docs = Document::where('user_id', $this->auth()->id())->get();
        return Inertia::render('Documents/Index', [
            'documents' => $docs
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
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

    /**
     * Display the specified resource.
     */
    public function show(Document $document): Response
    {
        return Inertia::render('Documents/Show', [
            'document' => $document
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Document $document): Response
    {
        return Inertia::render('Documents/Edit', [
            'document' => $document
        ]);
    }

    /**
     * Update the specified resource in storage.
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
            // For now, we'll just return success
            // TODO: Implement actual S3 storage
        }
        return $this->edit($document);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Document $document): RedirectResponse
    {
        $this->authorize('delete', $document);

        // TODO: Delete file from S3 using storage_path
        $document->delete();

        return redirect()->route('documents.index');
    }
}
