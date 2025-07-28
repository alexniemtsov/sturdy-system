<?php

namespace App\Http\Controllers;

use App\Models\Document;
use App\Models\DocumentShare;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class DocumentShareController extends AuthorizedController
{
    public function index(Document $document): JsonResponse
    {
        $this->authorize('view', $document);

        $shares = $document->shares()
            ->with(['user:id,name,email', 'sharedBy:id,name'])
            ->get()
            ->map(function ($share) {
                return [
                    'id' => $share->id,
                    'user' => [
                        'id' => $share->user->id,
                        'name' => $share->user->name,
                        'email' => $share->user->email,
                    ],
                    'permission' => $share->permission,
                    'shared_by' => [
                        'id' => $share->sharedBy->id,
                        'name' => $share->sharedBy->name,
                    ],
                    'shared_at' => $share->shared_at ? $share->shared_at->toISOString() : null,
                ];
            });

        return response()->json([
            'shares' => $shares,
            'can_share' => $document->isOwnedBy($this->auth()->user()),
        ]);
    }

    public function store(Request $request, Document $document): JsonResponse
    {
        $this->authorize('update', $document);

        $validated = $request->validate([
            'email' => 'required|email|exists:users,email',
            'permission' => 'required|in:read,write',
        ]);

        $userToShare = User::where('email', $validated['email'])->first();

        if (!$userToShare) {
            throw ValidationException::withMessages([
                'email' => 'User with this email does not exist.',
            ]);
        }

        if ($document->isOwnedBy($userToShare)) {
            throw ValidationException::withMessages([
                'email' => 'Cannot share document with the owner.',
            ]);
        }

        if ($document->isSharedWith($userToShare)) {
            throw ValidationException::withMessages([
                'email' => 'Document is already shared with this user.',
            ]);
        }

        $share = DocumentShare::create([
            'document_id' => $document->id,
            'user_id' => $userToShare->id,
            'shared_by' => $this->auth()->id(),
            'permission' => $validated['permission'],
            'shared_at' => now(),
        ]);

        $share->load(['user:id,name,email', 'sharedBy:id,name']);

        return response()->json([
            'message' => 'Document shared successfully.',
            'share' => [
                'id' => $share->id,
                'user' => [
                    'id' => $share->user->id,
                    'name' => $share->user->name,
                    'email' => $share->user->email,
                ],
                'permission' => $share->permission,
                'shared_by' => [
                    'id' => $share->sharedBy->id,
                    'name' => $share->sharedBy->name,
                ],
                'shared_at' => $share->shared_at ? $share->shared_at->toISOString() : null,
            ],
        ], 201);
    }

    public function update(Request $request, Document $document, DocumentShare $share): JsonResponse
    {
        $this->authorize('update', $document);

        if ($share->document_id !== $document->id) {
            return response()->json(['message' => 'Share does not belong to this document.'], 422);
        }

        $validated = $request->validate([
            'permission' => 'required|in:read,write',
        ]);

        $share->update([
            'permission' => $validated['permission'],
        ]);

        return response()->json([
            'message' => 'Permission updated successfully.',
            'share' => [
                'id' => $share->id,
                'permission' => $share->permission,
            ],
        ]);
    }

    public function destroy(Document $document, DocumentShare $share): JsonResponse
    {
        $this->authorize('update', $document);

        if ($share->document_id !== $document->id) {
            return response()->json(['message' => 'Share does not belong to this document.'], 422);
        }

        $share->delete();

        return response()->json([
            'message' => 'Document access revoked successfully.',
        ]);
    }
}
