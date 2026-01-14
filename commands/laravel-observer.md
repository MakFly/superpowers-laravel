---
name: /laravel-observer
description: Generate Eloquent observer
---

# Laravel Observer Generator

I'll help you create an Eloquent observer for model events.

## Usage

```bash
# Generate observer
php artisan make:observer VehicleObserver

# Generate observer with model
php artisan make:observer VehicleObserver --model=Vehicle
```

## Basic Observer

```php
// app/Observers/VehicleObserver.php
namespace App\Observers;

use App\Models\Vehicle;

class VehicleObserver
{
    public function creating(Vehicle $vehicle): void
    {
        $vehicle->slug = Str::slug($vehicle->make . '-' . $vehicle->model);
        $vehicle->uuid = (string) Str::uuid();
    }

    public function created(Vehicle $vehicle): void
    {
        \Log::info("Vehicle created: {$vehicle->id}");
    }

    public function updating(Vehicle $vehicle): void
    {
        if ($vehicle->isDirty('status') && $vehicle->status === 'sold') {
            $vehicle->sold_at = now();
        }
    }

    public function updated(Vehicle $vehicle): void
    {
        \Cache::forget("vehicle:{$vehicle->id}");
    }

    public function deleting(Vehicle $vehicle): void
    {
        // Before delete
        \Storage::delete($vehicle->image);
    }

    public function deleted(Vehicle $vehicle): void
    {
        // After delete
        \Log::warning("Vehicle deleted: {$vehicle->id}");
    }

    public function restoring(Vehicle $vehicle): void
    {
        // Before restore
    }

    public function restored(Vehicle $vehicle): void
    {
        // After restore
        \Cache::forget("vehicle:{$vehicle->id}");
    }
}
```

## Registering Observer

```php
// app/Providers/AppServiceProvider.php
namespace App\Providers;

use App\Models\Vehicle;
use App\Observers\VehicleObserver;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        Vehicle::observe(VehicleObserver::class);
    }

    public function register(): void
    {
        //
    }
}
```

## Available Events

| Event | Description |
|-------|-------------|
| `retrieved` | After retrieving a record |
| `creating` | Before creating a record |
| `created` | After creating a record |
| `updating` | Before updating a record |
| `updated` | After updating a record |
| `saving` | Before saving (create/update) |
| `saved` | After saving (create/update) |
| `deleting` | Before deleting |
| `deleted` | After deleting |
| `restoring` | Before restoring soft-delete |
| `restored` | After restoring soft-delete |

## Common Use Cases

### Auto-Generate Slug
```php
public function creating(Vehicle $vehicle): void
{
    $vehicle->slug = Str::slug($vehicle->make . '-' . $vehicle->model);
}
```

### Cache Management
```php
public function saved(Vehicle $vehicle): void
{
    \Cache::forget("vehicle:{$vehicle->id}");
    \Cache::tags(['vehicles'])->flush();
}
```

### Send Notifications
```php
public function created(Order $order): void
{
    $order->user->notify(new OrderCreatedNotification($order));
}
```

### Audit Logging
```php
public function updated(Vehicle $vehicle): void
{
    foreach ($vehicle->getDirty() as $key => $value) {
        AuditLog::create([
            'user_id' => auth()->id(),
            'model' => Vehicle::class,
            'model_id' => $vehicle->id,
            'field' => $key,
            'old_value' => $vehicle->getOriginal($key),
            'new_value' => $value,
        ]);
    }
}
```

### File Cleanup
```php
public function deleted(Vehicle $vehicle): void
{
    if ($vehicle->image) {
        \Storage::disk('s3')->delete($vehicle->image);
    }
}
```

### Search Indexing
```php
public function saved(Vehicle $vehicle): void
{
    Search::index('vehicles')->upsert($vehicle->toArray(), $vehicle->id);
}

public function deleted(Vehicle $vehicle): void
{
    Search::index('vehicles')->delete($vehicle->id);
}
```

## Disabling Observers Temporarily

```php
// Disable for specific operations
Vehicle::withoutEvents(function () {
    Vehicle::factory()->count(10)->create();
});

// Or save without events
$vehicle = new Vehicle();
$vehicle->saveQuietly();
```

What observer would you like to create?
1. Tell me the model name
2. Describe which events you want to observe
3. I'll generate the observer code
