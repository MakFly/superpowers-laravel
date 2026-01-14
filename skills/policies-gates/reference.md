# Reference

---
name: laravel:policies-gates
description: Authorization with Policies and Gates
---

# Laravel Authorization

## Gates

### Defining Gates

```php
// app/Providers/AuthServiceProvider.php
use Illuminate\Support\Facades\Gate;

public function boot(): void
{
    // Simple gate
    Gate::define('update-settings', function ($user) {
        return $user->is_admin;
    });

    // Gate with model
    Gate::define('update-post', function ($user, $post) {
        return $user->id === $post->user_id;
    });

    // Gate with additional parameters
    Gate::define('create-comment', function ($user, $post, $comment) {
        return $post->allowsComments();
    });
}
```

### Using Gates

```php
// In controllers
public function update(Request $request, Post $post)
{
    if (Gate::denies('update-post', $post)) {
        abort(403);
    }

    // Or
    $this->authorize('update-post', $post);

    // Post update logic
}

// In blade
@can('update-post', $post)
    <button>Edit Post</button>
@elsecan('update-post', $post)
    <p>You cannot edit this post.</p>
@endcan

// Programmatically
if (Gate::allows('update-post', $post)) {
    // User can update
}

if (Gate::forUser($currentUser)->denies('update-post', $post)) {
    // Specific user cannot update
}
```

## Policies

### Creating Policies

```bash
# Create policy
php artisan make:policy VehiclePolicy

# Create policy with model
php artisan make:policy VehiclePolicy --model=Vehicle

# Create policy with model and CRUD methods
php artisan make:policy VehiclePolicy --model=Vehicle --full
```

### Basic Policy

```php
// app/Policies/VehiclePolicy.php
namespace App\Policies;

use App\Models\User;
use App\Models\Vehicle;

class VehiclePolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Vehicle $vehicle): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return $user->hasVerifiedEmail();
    }

    public function update(User $user, Vehicle $vehicle): bool
    {
        return $user->id === $vehicle->user_id;
    }

    public function delete(User $user, Vehicle $vehicle): bool
    {
        return $user->id === $vehicle->user_id;
    }

    public function restore(User $user, Vehicle $vehicle): bool
    {
        return $user->id === $vehicle->user_id;
    }

    public function forceDelete(User $user, Vehicle $vehicle): bool
    {
        return $user->isAdmin();
    }
}
```

### Registering Policies

```php
// app/Providers/AuthServiceProvider.php
use App\Models\Vehicle;
use App\Policies\VehiclePolicy;

protected $policies = [
    Vehicle::class => VehiclePolicy::class,
];

// Or auto-discovery (Laravel 11+)
// No manual registration needed if policy is in app/Policies
```

### Using Policies

```php
// In controllers
use App\Models\Vehicle;

public function update(Request $request, Vehicle $vehicle)
{
    $this->authorize('update', $vehicle);

    // Or with helper
    $this->authorize($vehicle);

    // Update logic
}

public function store(Request $request)
{
    $this->authorize('create', Vehicle::class);

    // Store logic
}

// In blade
@can('update', $vehicle)
    <button>Edit Vehicle</button>
@else
    <p>You cannot edit this vehicle.</p>
@endcan

@cannot('delete', $vehicle)
    <p>You cannot delete this vehicle.</p>
@endcannot

// Programmatically
if ($user->can('update', $vehicle)) {
    // Can update
}

if ($user->cannot('delete', $vehicle)) {
    // Cannot delete
}
```

## Policy Responses

```php
// app/Policies/VehiclePolicy.php
use Illuminate\Auth\Access\Response;

public function update(User $user, Vehicle $vehicle): Response
{
    return $user->id === $vehicle->user_id
        ? Response::allow()
        : Response::deny('You do not own this vehicle.');
}

public function publish(User $user, Vehicle $vehicle): Response
{
    if ($user->id !== $vehicle->user_id) {
        return Response::deny('You do not own this vehicle.');
    }

    if ($vehicle->photos->isEmpty()) {
        return Response::deny('Vehicle must have photos before publishing.');
    }

    return Response::allow();
}
```

## Policy Methods

### Before Check

```php
// app/Policies/VehiclePolicy.php
public function before(User $user, string $ability): bool|null
{
    if ($user->is_admin) {
        return true;
    }

    return null; // Fall through to other methods
}
```

### Guest Users

```php
// app/Policies/VehiclePolicy.php
public function view(?User $user, Vehicle $vehicle): bool
{
    return $vehicle->is_published;
}

public function create(?User $user): bool
{
    return false; // Guests cannot create
}
```

## Resource Controllers

```php
// app/Http/Controllers/VehicleController.php
use App\Models\Vehicle;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;

class VehicleController extends Controller
{
    public function index()
    {
        $this->authorize('viewAny', Vehicle::class);
        // Or
        $this->authorize(Vehicle::class);
    }

    public function create()
    {
        $this->authorize('create', Vehicle::class);
    }

    public function store(Request $request)
    {
        $this->authorize('create', Vehicle::class);
    }

    public function show(Vehicle $vehicle)
    {
        $this->authorize('view', $vehicle);
    }

    public function edit(Vehicle $vehicle)
    {
        $this->authorize('update', $vehicle);
    }

    public function update(Request $request, Vehicle $vehicle)
    {
        $this->authorize('update', $vehicle);
    }

    public function destroy(Vehicle $vehicle)
    {
        $this->authorize('delete', $vehicle);
    }
}
```

## Model Policies Helper

```php
// app/Models/Vehicle.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Vehicle extends Model
{
    // Auto-resolves to VehiclePolicy
}

// Usage
$user->can('update', $vehicle); // Calls VehiclePolicy::update()
$user->can('create', Vehicle::class); // Calls VehiclePolicy::create()
```

## Blade Authorization

```php
// @can
@can('update', $vehicle)
    <button>Edit</button>
@endcan

// @cannot
@cannot('delete', $vehicle)
    <p>Cannot delete</p>
@endcannot

// @canany
@canany(['update', 'delete'], $vehicle)
    <button>Manage</button>
@endcanany

// @elsecan
@can('update', $vehicle)
    <button>Edit</button>
@elsecan('delete', $vehicle)
    <button>Delete</button>
@endcan

// @else
@can('update', $vehicle)
    <button>Edit</button>
@else
    <p>Not authorized</p>
@endcan

// @can with roles
@role('admin')
    <p>Admin content</p>
@endrole

// Permission check
@permission('edit posts')
    <p>Can edit posts</p>
@endpermission
```

## Middleware

```php
// Register in routes
Route::put('/vehicles/{vehicle}', function (Vehicle $vehicle) {
    // Update logic
})->middleware('can:update,vehicle');

Route::post('/vehicles', function () {
    // Store logic
})->middleware('can:create,App\Models\Vehicle');

// In controller constructor
public function __construct()
{
    $this->middleware('can:update,vehicle')->only(['update', 'edit']);
    $this->middleware('can:create,App\Models\Vehicle')->only(['create', 'store']);
}
```

## Gates for Simple Checks

```php
// AuthServiceProvider.php
Gate::define('is-admin', function ($user) {
    return $user->is_admin;
});

Gate::define('has-verified-email', function ($user) {
    return $user->hasVerifiedEmail();
});

// Usage
$this->authorize('is-admin');
$user->can('has-verified-email');
@can('is-admin')
@endcan
```

## Best Practices

1. **Policies over gates**: Use policies for model authorization
2. **Gates for simple checks**: Use gates for non-model checks
3. **Return early**: Use before() for admin checks
4. **Be explicit**: Use descriptive ability names
5. **Test policies**: Write tests for authorization logic
6. **Use responses**: Provide helpful denial messages
7. **Consistent naming**: Follow Laravel conventions (view, create, update, delete)
8. **Document policies**: Add comments for complex logic
9. **Consider guest users**: Handle unauthenticated users
10. **Cache permissions**: Cache expensive permission checks

## Common Patterns

### Role-Based Access Control

```php
// app/Policies/VehiclePolicy.php
public function update(User $user, Vehicle $vehicle): bool
{
    return $user->hasRole('admin') || $user->id === $vehicle->user_id;
}

// Or with gate
Gate::define('admin', function ($user) {
    return $user->hasRole('admin');
});

// Usage
if (Gate::allows('admin')) {
    // Admin access
}
```

### Ownership Check

```php
// app/Policies/VehiclePolicy.php
public function update(User $user, Vehicle $vehicle): bool
{
    return $vehicle->isOwnedBy($user);
}

// In model
// app/Models/Vehicle.php
public function isOwnedBy(User $user): bool
{
    return $this->user_id === $user->id;
}
```

### Team-Based Authorization

```php
// app/Policies/VehiclePolicy.php
public function update(User $user, Vehicle $vehicle): bool
{
    return $vehicle->team->users->contains($user);
}

public function delete(User $user, Vehicle $vehicle): bool
{
    return $vehicle->team->owner->is($user);
}
```

### Conditional Permissions

```php
// app/Policies/VehiclePolicy.php
public function publish(User $user, Vehicle $vehicle): bool
{
    // Must own vehicle AND have at least 3 photos
    return $user->id === $vehicle->user_id
        && $vehicle->photos()->count() >= 3;
}
```
