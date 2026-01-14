# Reference

---
name: laravel:observer-pattern
description: Eloquent Observers for model events
---

# Laravel Eloquent Observers

## Creating Observers

```bash
# Create observer
php artisan make:observer VehicleObserver --model=Vehicle

# Create observer without model
php artisan make:observer UserObserver
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
        Log::info("Vehicle created: {$vehicle->id}");
    }

    public function updating(Vehicle $vehicle): void
    {
        if ($vehicle->isDirty('status') && $vehicle->status === 'sold') {
            $vehicle->sold_at = now();
        }
    }

    public function updated(Vehicle $vehicle): void
    {
        Cache::forget("vehicle:{$vehicle->id}");
    }

    public function deleting(Vehicle $vehicle): void
    {
        // Before delete
        Storage::delete($vehicle->image);
    }

    public function deleted(Vehicle $vehicle): void
    {
        // After delete
        Log::warning("Vehicle deleted: {$vehicle->id}");
    }

    public function restoring(Vehicle $vehicle): void
    {
        // Before restore
    }

    public function restored(Vehicle $vehicle): void
    {
        // After restore
        Cache::forget("vehicle:{$vehicle->id}");
    }
}
```

## Registering Observers

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
| `saving` | Before saving a record (create or update) |
| `saved` | After saving a record (create or update) |
| `deleting` | Before deleting a record |
| `deleted` | After deleting a record |
| `restoring` | Before restoring a soft-deleted record |
| `restored` | After restoring a soft-deleted record |

## Observer Event Order

```
For creating:
1. creating
2. saving
3. created
4. saved

For updating:
1. retrieving
2. updating
3. saving
4. updated
5. saved

For deleting:
1. deleting
2. deleted
```

## Common Use Cases

### Auto-Generate Slug

```php
public function creating(Vehicle $vehicle): void
{
    $vehicle->slug = Str::slug($vehicle->make . '-' . $vehicle->model);
}
```

### Auto-Generate UUID

```php
public function creating(Model $model): void
{
    if (empty($model->uuid)) {
        $model->uuid = (string) Str::uuid();
    }
}
```

### Cache Management

```php
public function saved(Vehicle $vehicle): void
{
    Cache::forget("vehicle:{$vehicle->id}");
    Cache::tags(['vehicles'])->flush();
}

public function deleted(Vehicle $vehicle): void
{
    Cache::forget("vehicle:{$vehicle->id}");
    Cache::tags(['vehicles'])->flush();
}
```

### Send Notifications

```php
public function created(Order $order): void
{
    $order->user->notify(new OrderCreatedNotification($order));
}

public function updated(Order $order): void
{
    if ($order->wasChanged('status')) {
        $order->user->notify(new OrderStatusChangedNotification($order));
    }
}
```

### Audit Logging

```php
public function updated(Vehicle $vehicle): void
{
    foreach ($vehicle->getDirty() as $key => $value) {
        AuditLog::create([
            'user_id' => auth()->id(),
            'model_type' => Vehicle::class,
            'model_id' => $vehicle->id,
            'field' => $key,
            'old_value' => $vehicle->getOriginal($key),
            'new_value' => $value,
        ]);
    }
}
```

### SEO Meta Tags

```php
public function creating(Post $post): void
{
    if (empty($post->meta_description)) {
        $post->meta_description = Str::limit(strip_tags($post->content), 160);
    }
}
```

### Soft Delete Related

```php
public function deleting(User $user): void
{
    // Soft delete related vehicles
    $user->vehicles()->each(function ($vehicle) {
        $vehicle->delete();
    });
}
```

### File Cleanup

```php
public function deleted(Vehicle $vehicle): void
{
    if ($vehicle->image) {
        Storage::disk('s3')->delete($vehicle->image);
    }

    // Delete all related images
    $vehicle->images()->each(function ($image) {
        Storage::disk('s3')->delete($image->path);
        $image->delete();
    });
}
```

### Search Indexing

```php
public function saved(Vehicle $vehicle): void
{
    // Index in Algolia/Elasticsearch
    Search::index('vehicles')->upsert($vehicle->toArray(), $vehicle->id);
}

public function deleted(Vehicle $vehicle): void
{
    Search::index('vehicles')->delete($vehicle->id);
}
```

### Timestamp Tracking

```php
public function updating(Vehicle $vehicle): void
{
    if ($vehicle->isDirty('status')) {
        $vehicle->status_changed_at = now();
    }

    if ($vehicle->isDirty('price')) {
        $vehicle->price_changed_at = now();
        $vehicle->old_price = $vehicle->getOriginal('price');
    }
}
```

## Observer for Multiple Models

```php
// app/Observers/SearchableObserver.php
namespace App\Observers;

use App\Models\Vehicle;
use App\Models\Post;

class SearchableObserver
{
    public function saved($model): void
    {
        Search::index($model->getTable())->upsert($model->toArray(), $model->id);
    }

    public function deleted($model): void
    {
        Search::index($model->getTable())->delete($model->id);
    }
}
```

```php
// Register for multiple models
Vehicle::observe(SearchableObserver::class);
Post::observe(SearchableObserver::class);
```

## Observer vs Events

### Observers
- Model-specific
- All model events in one place
- Auto-dispatched
- Simpler for model logic

### Events + Listeners
- Can have multiple listeners
- Can be queued
- More flexible
- Better for cross-model logic

```php
// Event-driven approach
// app/Providers/EventServiceProvider.php
protected $listen = [
    'App\Events\VehicleCreated' => [
        'App\Listeners\SendVehicleCreatedEmail',
        'App\Listeners\UpdateSearchIndex',
        'App\Listeners\NotifyAdmin',
    ],
];
```

## Preventing Observers

```php
// Disable observer temporarily
Vehicle::withoutEvents(function () {
    Vehicle::factory()->count(10)->create();
});

// Or save without events
$vehicle = new Vehicle();
$vehicle->saveQuietly();
```

## Best Practices

1. **Keep observers light**: Don't do heavy processing
2. **Use queues**: Offload heavy work to jobs
3. **Handle errors**: Catch and log exceptions
4. **Test observers**: Write tests for observer logic
5. **Document behavior**: Comment complex logic
6. **Avoid infinite loops**: Be careful with updates
7. **Use queues**: For notifications, emails
8. **Check for changes**: Use `isDirty()` before acting
9. **Cache invalidation**: Clear caches in observers
10. **Soft delete**: Handle soft deletes properly

## Common Patterns

### Send Welcome Email

```php
public function created(User $user): void
{
    SendWelcomeEmail::dispatch($user);
}
```

### Track Model Changes

```php
public function updated(Vehicle $vehicle): void
{
    if ($vehicle->wasChanged('price')) {
        PriceChange::create([
            'vehicle_id' => $vehicle->id,
            'old_price' => $vehicle->getOriginal('price'),
            'new_price' => $vehicle->price,
        ]);
    }
}
```

### Sync with External Service

```php
public function saved(Order $order): void
{
    SyncOrderToCRM::dispatchIf($order->shouldSync(), $order);
}
```

### Maintain Counts

```php
public function created(Comment $comment): void
{
    $comment->post()->increment('comments_count');
}

public function deleted(Comment $comment): void
{
    $comment->post()->decrement('comments_count');
}
```

### Generate Reference

```php
public function creating(Order $order): void
{
    $order->reference = 'ORD-' . date('Y') . '-' . str_pad(Order::count() + 1, 6, '0', STR_PAD_LEFT);
}
```

### Status Transitions

```php
public function updating(Vehicle $vehicle): void
{
    if ($vehicle->isDirty('status') && $vehicle->status === 'published') {
        $vehicle->published_at = now();

        PublishVehicleJob::dispatch($vehicle);
    }
}
```

### Related Models

```php
public function deleting(User $user): void
{
    // Reassign vehicles to admin
    $admin = User::where('is_admin', true)->first();
    $user->vehicles()->update(['user_id' => $admin->id]);
}
```
