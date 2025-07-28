<?php
namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Contracts\Auth\Factory as AuthFactory;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;


class AuthorizedController extends Controller
{

    use AuthorizesRequests;

    public function auth(): AuthFactory
    {
        return auth();
    }
}
