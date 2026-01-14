# Reference

---
name: laravel:cache-strategies
description: Caching strategies with Redis and cache drivers in Laravel
---

# Laravel Cache Strategies

## Cache Configuration

```php
// config/cache.php
return [
    'default' => env('CACHE_DRIVER', 'redis'),

    'stores' => [
        'apc' => [
            'driver' => 'apc',
        ],

        'array' => [
            'driver' => 'array',
            'serialize' => false,
        ],

        'database' => [
            'driver' => 'database',
            'table' => 'cache',
            'connection' => null,
            'lock_connection' => null,
        ],

        'file' => [
            'driver' => 'file',
            'path' => storage_path('framework/cache/data'),
        ],

        'memcached' => [
            'driver' => 'memcached',
            'persistent_id' => env('MEMCACHED_PERSISTENT_ID'),
            'sasl' => [
                env('MEMCACHED_USERNAME'),
                env('MEMCACHED_PASSWORD'),
            ],
            'options' => [
                // Memcached::OPT_CONNECT_TIMEOUT => 2000,
            ],
            'servers' => [
                [
                    'host' => env('MEMCACHED_HOST', '127.0.0.1'),
                    'port' => env('MEMCACHED_PORT', 11211),
                    'weight' => 100,
                ],
            ],
        ],

        'redis' => [
            'driver' => 'redis',
            'connection' => 'cache',
            'lock_connection' => 'default',
        ],

        'dynamodb' => [
            'driver' => 'dynamodb',
            'key' => env('AWS_ACCESS_KEY_ID'),
            'secret' => env('AWS_SECRET_ACCESS_KEY'),
            'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
            'table' => env('DYNAMODB_CACHE_TABLE', 'cache'),
            'endpoint' => env('DYNAMODB_ENDPOINT'),
        ],

        'octane' => [
            'driver' => 'octane',
        ],
    ],

    'prefix' => env('CACHE_PREFIX', Str::slug(env('APP_NAME', 'laravel'), '_').'_cache_'),
];
```

## Basic Cache Usage

```php
use Illuminate\Support\Facades\Cache;

// Remember value forever
$value = Cache::remember('users', function () {
    return DB::table('users')->get();
});

// Remember for 60 seconds
$value = Cache::remember('users', 60, function () {
    return DB::table('users')->get();
});

// Remember forever
$value = Cache::rememberForever('users', function () {
    return DB::table('users')->get();
});

// Get or set
$value = Cache::get('key', 'default');
$value = Cache::get('key', function () {
    return DB::table('users')->find(1);
});

// Check if exists
if (Cache::has('key')) {
    //
}

// Store
Cache::put('key', 'value', 60);
Cache::put('key', 'value', now()->addHours(1));

// Store if not exists
Cache::add('key', 'value', 60);

// Forever
Cache::forever('key', 'value');

// Forget
Cache::forget('key');

// Clear all cache
Cache::flush();
```

## Cache Tags

```php
// Tag related items
Cache::tags(['vehicles', 'vehicle:1'])->put('vehicle:1:details', $vehicle, 3600);
Cache::tags(['vehicles', 'vehicle:2'])->put('vehicle:2:details', $vehicle, 3600);

// Flush all vehicles
Cache::tags(['vehicles'])->flush();

// Get tagged cache
$vehicle = Cache::tags(['vehicles'])->get('vehicle:1:details');
```

## Cache Locks

```php
use Illuminate\Support\Facades\Cache;

$lock = Cache::lock('process-payment', 10);

try {
    $lock->block(5);

    // Process payment
} finally {
    $lock->release();
}

// Or with callback
Cache::lock('process-payment')->get(function () {
    // Process payment
});

// Or using lockForUpdate in database
$vehicle = DB::table('vehicles')
    ->where('id', 1)
    ->lockForUpdate()
    ->first();
```

## Atomic Locks

```php
use Illuminate\Support\Facades\Cache;

$lock = Cache::lock('foo', 10);

if ($lock->get()) {
    // Lock acquired for 10 seconds
    $lock->release();
}

// Wait for lock
if ($lock->block(5)) {
    // Lock acquired after waiting max 5 seconds
    $lock->release();
}
```

## Model Caching

```php
// app/Traits/Cacheable.php
namespace App\Traits;

trait Cacheable
{
    public static function bootCacheable()
    {
        static::saved(function ($model) {
            Cache::forget($model->getCacheKey());
        });

        static::deleted(function ($model) {
            Cache::forget($model->getCacheKey());
        });
    }

    public function getCacheKey()
    {
        return sprintf('%s:%s', get_class($this), $this->id);
    }

    public static function cachedFind($id)
    {
        return Cache::remember(
            sprintf('%s:%s', get_called_class(), $id),
            3600,
            function () use ($id) {
                return static::find($id);
            }
        );
    }
}

// Usage
class Vehicle extends Model
{
    use Cacheable;
}

// Get from cache
$vehicle = Vehicle::cachedFind(1);
```

## Query Caching

```php
// Cache query results
$vehicles = Cache::remember('vehicles.all', 3600, function () {
    return Vehicle::all();
});

// Cache paginated results
$vehicles = Cache::remember('vehicles.page.' . request('page', 1), 60, function () {
    return Vehicle::paginate(15);
});

// Cache with relationships
$vehicle = Cache::remember('vehicle.' . $id, 3600, function () use ($id) {
    return Vehicle::with(['user', 'images'])->find($id);
});
```

## HTTP Cache Headers

```php
// app/Http/Middleware/CacheResponse.php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Support\Facades\Cache;

class CacheResponse
{
    public function handle($request, Closure $next, $minutes = 60)
    {
        if ($request->isMethod('GET')) {
            $key = 'response:' . $request->fullUrl();

            if (Cache::has($key)) {
                return response(Cache::get($key))
                    ->header('X-Cache', 'HIT');
            }

            $response = $next($request);

            Cache::put($key, $response->getContent(), $minutes);

            return $response->header('X-Cache', 'MISS')
                ->header('Cache-Control', "public, max-age={$minutes}");
        }

        return $next($request);
    }
}

// Usage
Route::get('/vehicles', [VehicleController::class, 'index'])
    ->middleware('cache.response:60');
```

## Cache Strategies

### Cache Aside

```php
function getVehicle($id)
{
    $key = "vehicle:{$id}";

    $vehicle = Cache::get($key);

    if ($vehicle === null) {
        $vehicle = Vehicle::find($id);

        if ($vehicle) {
            Cache::put($key, $vehicle, 3600);
        }
    }

    return $vehicle;
}
```

### Write Through

```php
function saveVehicle($data)
{
    $vehicle = Vehicle::create($data);

    Cache::put("vehicle:{$vehicle->id}", $vehicle, 3600);

    return $vehicle;
}
```

### Write Behind

```php
function saveVehicle($data)
{
    $vehicle = Vehicle::create($data);

    // Queue cache update
    UpdateVehicleCache::dispatch($vehicle->id);

    return $vehicle;
}
```

### Refresh Ahead

```php
function getVehicle($id)
{
    $key = "vehicle:{$id}";

    $vehicle = Cache::get($key);

    if ($vehicle) {
        // Refresh in background
        RefreshVehicleCache::dispatch($id);
    }

    return $vehicle ?? Vehicle::find($id);
}
```

## Redis Specific

```php
use Illuminate\Support\Facades\Redis;

// Lists
Redis::lpush('vehicles:recent', json_encode($vehicle));
$recent = Redis::lrange('vehicles:recent', 0, 9);

// Sets
Redis::sadd('user:1:favorites', $vehicleId);
$favorites = Redis::smembers('user:1:favorites');

// Sorted Sets
Redis::zadd('trending:vehicles', 100, $vehicleId);
$trending = Redis::zrevrange('trending:vehicles', 0, 9);

// Hashes
Redis::hset('vehicle:1', 'views', 100);
Redis::hincrby('vehicle:1', 'views', 1);
$views = Redis::hget('vehicle:1', 'views');

// Pub/Sub
Redis::publish('vehicle.updated', json_encode($vehicle));

// Transactions
Redis::transaction(function ($redis) {
    $redis->set('key', 'value');
    $redis->expire('key', 60);
});
```

## Cache Increment/Decrement

```php
// Increment
Cache::increment('key');
Cache::increment('key', 5);

// Decrement
Cache::decrement('key');
Cache::decrement('key', 5);
```

## Cache Many

```php
// Get multiple
$vehicles = Cache::many(['vehicle:1', 'vehicle:2', 'vehicle:3']);

// Put multiple
Cache::many([
    'vehicle:1' => ['value' => $vehicle1, 'seconds' => 3600],
    'vehicle:2' => ['value' => $vehicle2, 'seconds' => 3600],
]);
```

## Testing with Cache

```php
use Illuminate\Support\Facades\Cache;

/** @test */
public function it_caches_vehicle()
{
    Cache::shouldReceive('remember')
        ->once()
        ->with('vehicle:1', 3600, \Closure::class)
        ->andReturn($vehicle);

    $result = Vehicle::cachedFind(1);

    $this->assertEquals($vehicle->id, $result->id);
}

/** @test */
public function it_clears_cache_on_update()
{
    $vehicle = Vehicle::factory()->create();

    Cache::put('vehicle:1', $vehicle);

    $vehicle->update(['price' => 50000]);

    $this->assertNull(Cache::get('vehicle:1'));
}
```

## Best Practices

1. **Use Redis in production**: For best performance
2. **Set appropriate TTL**: Don't cache forever
3. **Use cache tags**: Group related items
4. **Cache keys**: Use consistent naming
5. **Handle cache failures**: Graceful degradation
6. **Monitor cache**: Hit/miss ratios
7. **Clear cache**: On updates/deletes
8. **Lock writes**: Prevent race conditions
9. **Compression**: For large data
10. **Eviction policies**: Configure Redis properly

## Common Patterns

### Cache with Automatic Invalidation

```php
trait Cacheable
{
    protected static function boot()
    {
        parent::boot();

        static::saved(function ($model) {
            Cache::tags([static::class])->flush();
        });
    }
}
```

### Pagination Cache

```php
function getVehicles($page)
{
    return Cache::remember("vehicles.page.{$page}", 60, function () {
        return Vehicle::paginate(15);
    });
}
```

### Count Cache

```php
function getVehicleCount()
{
    return Cache::remember('vehicles.count', 3600, function () {
        return Vehicle::count();
    });
}
```

### Search Cache

```php
function searchVehicles($query)
{
    $key = 'search:' . md5($query);

    return Cache::remember($key, 3600, function () use ($query) {
        return Vehicle::where('make', 'like', "%{$query}%")->get();
    });
}
```

### Distributed Cache

```php
function getVehicleFromCache($id)
{
    $fallback = function () use ($id) {
        return Vehicle::find($id);
    };

    return Cache::driver('redis')
        ->remember("vehicle:{$id}", 3600, $fallback);
}
```

### Cache Warming

```php
// app/Console/Commands/WarmCache.php
public function handle()
{
    Vehicle::chunk(100, function ($vehicles) {
        foreach ($vehicles as $vehicle) {
            Cache::put("vehicle:{$vehicle->id}", $vehicle, 3600);
        }
    });

    $this->info('Cache warmed successfully!');
}
```
