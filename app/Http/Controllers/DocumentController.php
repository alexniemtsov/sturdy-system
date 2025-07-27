<?php

namespace App\Http\Controllers;

use App\Models\Document;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DocumentController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        $docs = Document::all();
        return Inertia::render('Documents/Index', [
            'documents' => $docs
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): void
    {
        // Create new file on S3, return link pointing to it.
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): void
    {
        // Create new file on S3, return link pointing to it.
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
    public function edit(Document $document): void
    {
        //
    }

    /**
     * Update the specified resource in storage.
     * Called frequently for autosave
     */
    public function update(Request $request, Document $document): void
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Document $document): void
    {
        //
    }
}
