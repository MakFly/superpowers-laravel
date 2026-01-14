---
name: /laravel-middleware
description: Generate middleware
---

# Laravel Middleware Generator

I'll help you create a middleware for request filtering.

## Usage

```bash
# Generate middleware
php artisan make:middleware CheckAge

# Generate middleware in subdirectory
php artisan make:middleware API/ValidateSignature
```

## Basic Middleware

```php
// app/Http/Middleware/CheckAge.php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CheckAge
{
    public function handle(Request $request, Closure $next)
    {
        if ($request->age < 18) {
            return redirect('home');
        }

        return $next($request);
    }
}
```

## Registering Middleware

### Global Middleware
```php
// app/Http/Kernel.php (Laravel 10)
protected $middleware = [
    \App\Http\Middleware\CheckAge::class,
];

// bootstrap/app.php (Laravel 11)
->withMiddleware(function (Middleware $middleware) {
    $middleware->use([
        \App\Http\Middleware\CheckAge::class,
    ]);
})
```

### Route Middleware
```php
// app/Http/Kernel.php (Laravel 10)
protected $routeMiddleware = [
    'age' => \App\Http\Middleware\CheckAge::class,
];

// bootstrap/app.php (Laravel 11)
->withMiddleware(function (Middleware $middleware) {
    $middleware->alias([
        'age' => \App\Http\Middleware\CheckAge::class,
    ]);
})
```

## Middleware with Parameters

```php
// app/Http/Middleware/CheckRole.php
public function handle(Request $request, Closure $next, ...$roles)
{
    if (! $request->user()->hasRole($roles)) {
        abort(403);
    }

    return $next($request);
}
```

Usage:
```php
Route::get('/admin', function () {
    // Admin logic
})->middleware('role:admin,editor');
```

## Common Middleware Types

### Authentication
```php
public function handle(Request $request, Closure $next)
{
    if (! auth()->check()) {
        return redirect('login');
    }

    return $next($request);
}
```

### Rate Limiting
```php
public function handle(Request $request, Closure $next)
{
    $key = 'login:' . $request->ip();

    if (RateLimiter::tooManyAttempts($key, 5)) {
        return response('Too many attempts.', 429);
    }

    RateLimiter::hit($key, 60);

    return $next($request);
}
```

### API Token
```php
public function handle(Request $request, Closure $next)
{
    $token = $request->bearerToken();

    if (! $token || ! $this->isValidToken($token)) {
        return response('Invalid token', 401);
    }

    return $next($request);
}
```

### Force HTTPS
```php
public function handle(Request $request, Closure $next)
{
    if (! $request->secure() && app()->environment('production')) {
        return redirect()->secure($request->getRequestUri());
    }

    return $next($request);
}
```

### CORS
```php
public function handle(Request $request, Closure $next)
{
    return $next($request)
        ->header('Access-Control-Allow-Origin', '*')
        ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE')
        ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}
```

### Logging
```php
public function handle(Request $request, Closure $next)
{
    Log::info('Incoming request', [
        'url' => $request->url(),
        'method' => $request->method(),
        'ip' => $request->ip(),
    ]);

    return $next($request);
}
```

### Locale Detection
```php
public function handle(Request $request, Closure $next)
{
    $locale = $request->session()->get('locale')
        ?? $request->header('Accept-Language')
        ?? 'en';

    app()->setLocale($locale);

    return $next($request);
}
```

### Maintenance Mode Bypass
```php
public function handle(Request $request, Closure $next)
{
    if ($request->user()?->isAdmin()) {
        config(['app.maintenance' => false]);
    }

    return $next($request);
}
```

## Terminable Middleware

```php
use Illuminate\Http\Response;

public function handle(Request $request, Closure $next)
{
    return $next($request);
}

public function terminate(Request $request, Response $response)
{
    Log::info('Request completed', [
        'url' => $request->url(),
        'status' => $response->getStatusCode(),
    ]);
}
```

## Applying Middleware

### On Routes
```php
Route::get('/admin', function () {
    // Admin logic
})->middleware('auth');

Route::middleware(['auth', 'admin'])->group(function () {
    Route::get('/dashboard', function () { });
});
```

### On Controllers
```php
class UserController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
        $this->middleware('log')->only('index');
        $this->middleware('subscribed')->except('store');
    }
}
```

## Middleware Groups

```php
// app/Http/Kernel.php
protected $middlewareGroups = [
    'web' => [
        \App\Http\Middleware\EncryptCookies::class,
        \Illuminate\Session\Middleware\StartSession::class,
        \Illuminate\View\Middleware\ShareErrorsFromSession::class,
        \App\Http\Middleware\VerifyCsrfToken::class,
        \Illuminate\Routing\Middleware\SubstituteBindings::class,
    ],
    'api' => [
        'throttle:api',
        \Illuminate\Routing\Middleware\SubstituteBindings::class,
    ],
];
```

Usage:
```php
Route::middleware(['web'])->group(function () {
    // Routes
});
```

What middleware would you like to create?
1. Tell me the middleware name
2. Describe what it should do
3. I'll generate the middleware code
