# Reference

---
name: laravel:middleware
description: HTTP Middleware for request filtering in Laravel
---

# Laravel Middleware

## Creating Middleware

```bash
# Create middleware
php artisan make:middleware CheckAge

# Create middleware in subdirectory
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
    \App\Http\Middleware\TrustProxies::class,
    \App\Http\Middleware\PreventRequestsDuringMaintenance::class,
];

// bootstrap/app.php (Laravel 11)
->withMiddleware(function (Middleware $middleware) {
    $middleware->use([
        \App\Http\Middleware\TrustProxies::class,
    ]);
})
```

### Route Middleware

```php
// app/Http/Kernel.php (Laravel 10)
protected $routeMiddleware = [
    'auth' => \App\Http\Middleware\Authenticate::class,
    'role' => \App\Http\Middleware\CheckRole::class,
];

// bootstrap/app.php (Laravel 11)
->withMiddleware(function (Middleware $middleware) {
    $middleware->alias([
        'role' => \App\Http\Middleware\CheckRole::class,
        'admin' => \App\Http\Middleware\IsAdmin::class,
    ]);
})
```

### Middleware Groups

```php
// app/Http/Kernel.php (Laravel 10)
protected $middlewareGroups = [
    'web' => [
        \App\Http\Middleware\EncryptCookies::class,
        \Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse::class,
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

// bootstrap/app.php (Laravel 11)
->withMiddleware(function (Middleware $middleware) {
    $middleware->web([
        \App\Http\Middleware\EncryptCookies::class,
        // ...
    ]);

    $middleware->api([
        \App\Http\Middleware\EnsureTokenIsValid::class,
        // ...
    ]);

    $middleware->group('custom', [
        \App\Http\Middleware\CustomMiddleware::class,
    ]);
})
```

## Applying Middleware

### On Routes

```php
// Single middleware
Route::get('/admin', function () {
    // Admin logic
})->middleware('auth');

// Multiple middleware
Route::get('/admin', function () {
    // Admin logic
})->middleware(['auth', 'admin']);

// With parameters
Route::get('/admin', function () {
    // Admin logic
})->middleware('role:editor,publisher');

// Middleware group
Route::middleware(['web'])->group(function () {
    Route::get('/', function () { });
    Route::get('/profile', function () { });
});

// Exclude middleware
Route::withoutMiddleware([\App\Http\Middleware\VerifyCsrfToken::class])
    ->post('/webhook', function () {
        // CSRF exempt
    });
```

### On Controllers

```php
// Constructor
class UserController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
        $this->middleware('log')->only('index');
        $this->middleware('subscribed')->except('store');
    }
}

// Middleware in controller method
Route::get('/profile', [ProfileController::class, 'show'])
    ->middleware('auth');
```

### In Route Groups

```php
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index']);
    Route::get('/orders', [OrderController::class, 'index']);
});
```

## Middleware Parameters

```php
// app/Http/Middleware/CheckRole.php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CheckRole
{
    public function handle(Request $request, Closure $next, ...$roles)
    {
        if (! $request->user()->hasRole($roles)) {
            abort(403);
        }

        return $next($request);
    }
}
```

```php
// Usage
Route::get('/admin', function () {
    // Admin logic
})->middleware('role:admin,editor');

// Or with comma-separated
Route::get('/admin', function () {
    // Admin logic
})->middleware('role:admin,editor,publisher');
```

## Terminable Middleware

```php
// app/Http/Middleware/LogAfterRequest.php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class LogAfterRequest
{
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
}
```

## Common Middleware Patterns

### Authentication

```php
// app/Http/Middleware/Authenticate.php
namespace App\Http\Middleware;

use Illuminate\Auth\Middleware\Authenticate as Middleware;

class Authenticate extends Middleware
{
    protected function redirectTo($request)
    {
        if (! $request->expectsJson()) {
            return route('login');
        }
    }
}
```

### CSRF Protection

```php
// app/Http/Middleware/VerifyCsrfToken.php
namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken as Middleware;

class VerifyCsrfToken extends Middleware
{
    protected $except = [
        'webhook/*',
        'api/external',
        'stripe/*',
    ];
}
```

### Rate Limiting

```php
// app/Http/Middleware/ThrottleRequests.php
namespace App\Http\Middleware;

use Illuminate\Cache\RateLimiter;
use Illuminate\Http\Request;
use Closure;

class ThrottleRequests
{
    public function handle(Request $request, Closure $next, $maxAttempts = 60, $decayMinutes = 1)
    {
        $key = $this->resolveRequestSignature($request);

        if ($this->limiter->tooManyAttempts($key, $maxAttempts)) {
            return response('Too Many Attempts.', 429);
        }

        $this->limiter->hit($key, $decayMinutes * 60);

        return $next($request);
    }
}

// Usage
Route::middleware('throttle:60,1')->group(function () {
    // 60 attempts per minute
});
```

### API Token Authentication

```php
// app/Http/Middleware/EnsureTokenIsValid.php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureTokenIsValid
{
    public function handle(Request $request, Closure $next)
    {
        $token = $request->bearerToken();

        if (! $token || ! $this->isValidToken($token)) {
            return response('Invalid token', 401);
        }

        return $next($request);
    }

    private function isValidToken($token)
    {
        return hash_equals(env('API_TOKEN'), $token);
    }
}
```

### CORS Headers

```php
// app/Http/Middleware/Cors.php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class Cors
{
    public function handle(Request $request, Closure $next)
    {
        return $next($request)
            ->header('Access-Control-Allow-Origin', '*')
            ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }
}
```

### Force HTTPS

```php
// app/Http/Middleware/ForceHttps.php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class ForceHttps
{
    public function handle(Request $request, Closure $next)
    {
        if (!$request->secure() && app()->environment('production')) {
            return redirect()->secure($request->getRequestUri());
        }

        return $next($request);
    }
}
```

### Locale Detection

```php
// app/Http/Middleware/SetLocale.php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;

class SetLocale
{
    public function handle(Request $request, Closure $next)
    {
        $locale = $request->session()->get('locale')
            ?? $request->header('Accept-Language')
            ?? 'en';

        App::setLocale($locale);

        return $next($request);
    }
}
```

### Logging

```php
// app/Http/Middleware/LogRequest.php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class LogRequest
{
    public function handle(Request $request, Closure $next)
    {
        Log::info('Incoming request', [
            'url' => $request->url(),
            'method' => $request->method(),
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return $next($request);
    }
}
```

### JSON Response for API

```php
// app/Http/Middleware/ForceJsonResponse.php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class ForceJsonResponse
{
    public function handle(Request $request, Closure $next)
    {
        $request->headers->set('Accept', 'application/json');

        return $next($request);
    }
}
```

## Middleware Order

Middleware executes in order defined:

```php
// First
Route::middleware(['first', 'second', 'third'])->get('/path', function () {
    // Execution order: first -> second -> third -> route -> third -> second -> first
});
```

## Best Practices

1. **Keep middleware small**: Single responsibility
2. **Use parameters**: Make middleware configurable
3. **Name clearly**: Describe what middleware does
4. **Handle exceptions**: Return appropriate responses
5. **Test thoroughly**: Unit test middleware logic
6. **Use terminate wisely**: For logging after response
7. **Group related**: Use middleware groups
8. **Document**: Add comments for complex logic
9. **Exclude wisely**: Use $except arrays
10. **Keep order**: Mind execution order

## Common Patterns

### Role-Based Access Control

```php
// app/Http/Middleware/CheckRole.php
public function handle(Request $request, Closure $next, ...$roles)
{
    $user = $request->user();

    if (! $user || ! $user->hasAnyRole($roles)) {
        abort(403, 'Unauthorized action.');
    }

    return $next($request);
}

// Usage
Route::middleware('role:admin,editor')->group(function () {
    Route::resource('posts', PostController::class);
});
```

### Tenant Resolution

```php
// app/Http/Middleware/ResolveTenant.php
public function handle(Request $request, Closure $next)
{
    $subdomain = $request->route('subdomain');

    if (! $tenant = Tenant::where('subdomain', $subdomain)->first()) {
        abort(404);
    }

    tenant()->bind($tenant);

    return $next($request);
}
```

### Maintenance Mode Bypass

```php
// app/Http/Middleware/BypassMaintenanceForAdmins.php
public function handle(Request $request, Closure $next)
{
    if ($request->user()?->isAdmin()) {
        config(['app.maintenance' => false]);
    }

    return $next($request);
}
```
