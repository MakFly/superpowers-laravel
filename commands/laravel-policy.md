---
name: /laravel-policy
description: Generate authorization policy
---

# Laravel Policy Generator

I'll help you create an authorization policy for your models.

## Usage

```bash
# Generate policy
php artisan make:policy VehiclePolicy

# Generate policy with model
php artisan make:policy VehiclePolicy --model=Vehicle

# Generate policy with CRUD methods
php artisan make:policy VehiclePolicy --model=Vehicle --full
```

## Basic Policy

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

## Registering Policy

```php
// app/Providers/AuthServiceProvider.php
use App\Models\Vehicle;
use App\Policies\VehiclePolicy;

protected $policies = [
    Vehicle::class => VehiclePolicy::class,
];

// Or auto-discovery (Laravel 11+)
// No manual registration needed
```

## Using Policies

### In Controllers
```php
public function update(Request $request, Vehicle $vehicle)
{
    $this->authorize('update', $vehicle);

    // Or with model
    $this->authorize($vehicle);

    $vehicle->update($request->all());
}
```

### In Blade
```blade
@can('update', $vehicle)
    <button>Edit Vehicle</button>
@elsecan('update', $vehicle)
    <p>You cannot edit this vehicle.</p>
@endcan

@cannot('delete', $vehicle)
    <p>You cannot delete this vehicle.</p>
@endcannot
```

### In Code
```php
if ($user->can('update', $vehicle)) {
    // Can update
}

if ($user->cannot('delete', $vehicle)) {
    // Cannot delete
}
```

## Response with Messages

```php
use Illuminate\Auth\Access\Response;

public function update(User $user, Vehicle $vehicle): Response
{
    return $user->id === $vehicle->user_id
        ? Response::allow()
        : Response::deny('You do not own this vehicle.');
}
```

## Before Check (Admin)

```php
public function before(User $user, string $ability): bool|null
{
    if ($user->is_admin) {
        return true;
    }

    return null; // Fall through to other methods
}
```

## Guest Users

```php
public function view(?User $user, Vehicle $vehicle): bool
{
    return $vehicle->is_published;
}

public function create(?User $user): bool
{
    return false; // Guests cannot create
}
```

## Policy Responses

```php
use Illuminate\Auth\Access\Response;

public function publish(User $user, Vehicle $vehicle): Response
{
    if ($user->id !== $vehicle->user_id) {
        return Response::deny('You do not own this vehicle.');
    }

    if ($vehicle->photos->isEmpty()) {
        return Response::deny('Vehicle must have photos.');
    }

    return Response::allow();
}
```

## Common Patterns

### Role-Based Access
```php
public function update(User $user, Vehicle $vehicle): bool
{
    return $user->hasRole('admin') || $user->id === $vehicle->user_id;
}
```

### Ownership Check
```php
public function update(User $user, Vehicle $vehicle): bool
{
    return $vehicle->isOwnedBy($user);
}

// In model
public function isOwnedBy(User $user): bool
{
    return $this->user_id === $user->id;
}
```

### Team-Based
```php
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
public function publish(User $user, Vehicle $vehicle): bool
{
    // Must own vehicle AND have at least 3 photos
    return $user->id === $vehicle->user_id
        && $vehicle->photos()->count() >= 3;
}
```

## Middleware

```php
// In routes
Route::put('/vehicles/{vehicle}', function (Vehicle $vehicle) {
    // Update logic
})->middleware('can:update,vehicle');

Route::post('/vehicles', function () {
    // Store logic
})->middleware('can:create,App\Models\Vehicle');
```

## Resource Controllers

```php
public function __construct()
{
    $this->middleware('can:update,vehicle')->only(['update', 'edit']);
    $this->middleware('can:create,App\Models\Vehicle')->only(['create', 'store']);
}
```

What policy would you like to create?
1. Tell me the model name
2. Describe the permissions needed
3. I'll generate the policy code
