# Reference

---
name: laravel:api-authentication
description: API authentication with Sanctum and Passport
---

# Laravel API Authentication

## Laravel Sanctum (Lightweight)

### Installation

```bash
composer require laravel/sanctum

php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"

php artisan migrate
```

### Configuration

```php
// config/sanctum.php
return [
    'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', sprintf(
        '%s%s',
        'localhost,localhost:3000,127.0.0.1,127.0.0.1:8000,::1',
        env('APP_URL') ? ','.parse_url(env('APP_URL'), PHP_URL_HOST) : ''
    ))),

    'guard' => ['web'],

    'expiration' => null,
    'middleware' => [
        'verify_csrf_token' => App\Http\Middleware\VerifyCsrfToken::class,
        'encrypt_cookies' => App\Http\Middleware\EncryptCookies::class,
    ],
];
```

### SPA Authentication

```php
// config/cors.php
return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => ['http://localhost:3000'],

    'allowed_origins_patterns' => ['/^http:\/\/localhost(:\d+)?$/'],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,
];
```

```php
// routes/api.php
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});
```

### API Token Authentication

```php
// Create token for user
$user->createToken('token-name')->plainTextToken;

// Create token with abilities
$user->createToken('token-name', ['server:update'])->plainTextToken;

// Check token abilities
if ($user->tokenCan('server:update')) {
    // Can update
}

// Revoke token
$user->tokens()->where('id', $tokenId)->delete();
```

```php
// routes/api.php
Route::post('/tokens/create', function (Request $request) {
    $token = $request->user()->createToken($request->token_name);

    return ['token' => $token->plainTextToken];
})->middleware('auth:sanctum');
```

### Protecting Routes

```php
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/vehicles', [VehicleController::class, 'index']);
    Route::post('/vehicles', [VehicleController::class, 'store']);
    Route::put('/vehicles/{vehicle}', [VehicleController::class, 'update']);
    Route::delete('/vehicles/{vehicle}', [VehicleController::class, 'destroy']);
});

// With abilities
Route::delete('/vehicles/{vehicle}', function (Vehicle $vehicle) {
    abort_unless($vehicle->owner_id === auth()->id(), 403);
    $vehicle->delete();
})->middleware('auth:sanctum')->can('delete', 'vehicle');
```

## Laravel Passport (Full OAuth2)

### Installation

```bash
composer require laravel/passport

php artisan passport:install

php artisan migrate
```

### Configuration

```php
// app/Providers/AuthServiceProvider.php
use Laravel\Passport\Passport;

public function boot(): void
{
    $this->registerPolicies();

    Passport::useTokenModel(Token::class);
    Passport::useClientModel(Client::class);
    Passport::useAuthCodeModel(AuthCode::class);
    Passport::usePersonalAccessClientModel(PersonalAccessClient::class);
    Passport::useRefreshTokenModel(RefreshToken::class);

    Passport::tokensExpireIn(now()->addDays(15));
    Passport::refreshTokensExpireIn(now()->addDays(30));
    Passport::personalAccessTokensExpireIn(now()->addMonths(6));

    Passport::enableImplicitGrant();

    Passport::tokensCan([
        'create-vehicle' => 'Create a vehicle',
        'edit-vehicle' => 'Edit a vehicle',
        'delete-vehicle' => 'Delete a vehicle',
    ]);
}
```

### API Routes

```php
Route::middleware('auth:api')->get('/user', function (Request $request) {
    return $request->user();
});

// Password Grant
Route::post('/oauth/token', [AccessTokenController::class, 'issueToken']);

// Authorization Code
Route::get('/oauth/authorize', [AuthorizationController::class, 'authorize']);
```

### Client Credentials Grant

```php
Route::post('/tokens/create', function (Request $request) {
    $http = new GuzzleHttp\Client;

    $response = $http->post('http://your-app.com/oauth/token', [
        'form_params' => [
            'grant_type' => 'client_credentials',
            'client_id' => 'client-id',
            'client_secret' => 'client-secret',
            'scope' => 'create-vehicle',
        ],
    ]);

    return json_decode((string) $response->getBody(), true);
});
```

### PKCE (Public Clients)

```php
Route::get('/auth/code', function () {
    $state = Str::random(40);
    $codeVerifier = Str::random(128);

    $codeChallenge = strtr(rtrim(
        base64_encode(hash('sha256', $codeVerifier, true))
    ), '+/', '-_');

    session([
        'oauth.state' => $state,
        'oauth.code_verifier' => $codeVerifier,
    ]);

    $query = http_build_query([
        'client_id' => 'client-id',
        'redirect_uri' => 'http://localhost:3000/callback',
        'response_type' => 'code',
        'scope' => '',
        'state' => $state,
        'code_challenge' => $codeChallenge,
        'code_challenge_method' => 'S256',
    ]);

    return redirect('http://your-app.com/oauth/authorize?' . $query);
});
```

## Authentication Controllers

### Login

```php
// app/Http/Controllers/Auth/LoginController.php
namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class LoginController extends Controller
{
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        if (Auth::attempt($credentials)) {
            $request->session()->regenerate();

            return response()->json([
                'message' => 'Authenticated',
                'user' => Auth::user(),
            ]);
        }

        return response()->json([
            'message' => 'Invalid credentials'
        ], 401);
    }
}
```

### Registration

```php
// app/Http/Controllers/Auth/RegisterController.php
namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class RegisterController extends Controller
{
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'unique:users'],
            'password' => ['required', 'confirmed', 'min:8'],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
        ]);

        event(new Registered($user));

        Auth::login($user);

        return response()->json([
            'message' => 'User registered',
            'user' => $user,
        ], 201);
    }
}
```

### Logout

```php
// app/Http/Controllers/Auth/LogoutController.php
namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class LogoutController extends Controller
{
    public function logout(Request $request)
    {
        // Revoke current token (Sanctum)
        $request->user()->currentAccessToken()->delete();

        // Or logout session
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([
            'message' => 'Logged out'
        ]);
    }
}
```

## Middleware

### Authenticate Middleware

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

        if (! $token) {
            return response()->json(['error' => 'Token required'], 401);
        }

        if (! $this->isValidToken($token)) {
            return response()->json(['error' => 'Invalid token'], 401);
        }

        return $next($request);
    }

    private function isValidToken($token)
    {
        return auth()->check();
    }
}
```

### Throttling

```php
Route::middleware('throttle:login')->group(function () {
    Route::post('/login', [LoginController::class, 'login']);
    Route::post('/register', [RegisterController::class, 'register']);
});
```

## Testing Authentication

```php
// tests/Feature/AuthTest.php
use App\Models\User;

/** @test */
public function user_can_login()
{
    $user = User::factory()->create([
        'password' => bcrypt('password'),
    ]);

    $response = $this->postJson('/api/login', [
        'email' => $user->email,
        'password' => 'password',
    ]);

    $response->assertStatus(200)
        ->assertJsonPath('message', 'Authenticated');
}

/** @test */
public function user_can_authenticate_with_sanctum()
{
    $user = User::factory()->create();
    $token = $user->createToken('test-token')->plainTextToken;

    $response = $this->withToken($token)
        ->getJson('/api/user');

    $response->assertStatus(200)
        ->assertJsonPath('id', $user->id);
}

/** @test */
public function protected_route_requires_authentication()
{
    $response = $this->getJson('/api/vehicles');

    $response->assertStatus(401);
}

/** @test */
public function authenticated_user_can_access_protected_route()
{
    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->getJson('/api/vehicles');

    $response->assertStatus(200);
}
```

## Best Practices

1. **Use Sanctum for SPA**: Simple token auth
2. **Use Passport for OAuth**: Full OAuth2 implementation
3. **HTTPS only**: Never send tokens over HTTP
4. **Short-lived tokens**: Set appropriate expiration
5. **Rotate tokens**: Refresh tokens periodically
6. **Revoke on logout**: Always invalidate tokens
7. **Scope permissions**: Use token abilities/scopes
8. **Rate limiting**: Throttle auth endpoints
9. **Secure headers**: Set proper CORS and CSP
10. **Log auth attempts**: Monitor for suspicious activity

## Common Patterns

### Token Refresh

```php
Route::post('/token/refresh', function (Request $request) {
    $user = $request->user();

    // Revoke old token
    $user->currentAccessToken()->delete();

    // Create new token
    $newToken = $user->createToken('new-token');

    return response()->json([
        'token' => $newToken->plainTextToken,
    ]);
})->middleware('auth:sanctum');
```

### Multi-Device Auth

```php
Route::post('/tokens', function (Request $request) {
    $user = $request->user();

    $tokens = $user->tokens->map(function ($token) {
        return [
            'id' => $token->id,
            'name' => $token->name,
            'last_used_at' => $token->last_used_at,
        ];
    });

    return response()->json(['tokens' => $tokens]);
})->middleware('auth:sanctum');

Route::delete('/tokens/{id}', function (Request $request, $tokenId) {
    $request->user()->tokens()->where('id', $tokenId)->delete();

    return response()->json(null, 204);
})->middleware('auth:sanctum');
```

### Device Name

```php
$user->createToken('mobile-app')->plainTextToken;
$user->createToken('web-dashboard')->plainTextToken;
```

### Revoking All Tokens

```php
$user->tokens()->delete();
```

### Check Token Abilities

```php
Route::delete('/vehicles/{vehicle}', function (Vehicle $vehicle) {
    $user = request()->user();

    abort_unless($user->tokenCan('delete:vehicle'), 403);

    $vehicle->delete();

    return response()->json(null, 204);
})->middleware('auth:sanctum');
```
