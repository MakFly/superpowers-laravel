# Reference

---
name: laravel:service-providers
description: Service Providers and dependency injection in Laravel
---

# Laravel Service Providers

## Creating Providers

```bash
# Create provider
php artisan make:provider VehicleServiceProvider

# Create provider in subdirectory
php artisan make:provider Services/GeoServiceProvider
```

## Basic Provider

```php
// app/Providers/VehicleServiceProvider.php
namespace App\Providers;

use App\Services\VehicleService;
use Illuminate\Support\ServiceProvider;

class VehicleServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(VehicleService::class, function ($app) {
            return new VehicleService();
        });
    }

    public function boot(): void
    {
        // Boot logic
    }
}
```

## Registering Providers

```php
// config/app.php
'providers' => [
    // ...
    App\Providers\VehicleServiceProvider::class,
],

// Or Laravel 11+ (bootstrap/providers.php)
return [
    App\Providers\AppServiceProvider::class,
    App\Providers\VehicleServiceProvider::class,
];
```

## Service Container Bindings

### Simple Binding

```php
public function register(): void
{
    $this->app->bind(VehicleService::class, function ($app) {
        return new VehicleService();
    });
}
```

### Singleton Binding

```php
public function register(): void
{
    $this->app->singleton(VehicleService::class, function ($app) {
        return new VehicleService();
    });
}
```

### Instance Binding

```php
public function register(): void
{
    $this->app->instance(VehicleService::class, new VehicleService());
}
```

### Interface to Implementation Binding

```php
public function register(): void
{
    $this->app->bind(
        App\Contracts\VehicleRepositoryInterface::class,
        App\Repositories\VehicleRepository::class
    );
}
```

### Contextual Binding

```php
public function register(): void
{
    $this->app->when(VehicleController::class)
        ->needs(VehicleRepositoryInterface::class)
        ->give(function () {
            return new DatabaseVehicleRepository();
        });

    $this->app->when(ApiController::class)
        ->needs(VehicleRepositoryInterface::class)
        ->give(function () {
            return new ApiVehicleRepository();
        });
}
```

### Prunable Bindings

```php
public function register(): void
{
    $this->app->bind(CacheManager::class);

    $this->app->prunable([CacheManager::class]);
}
```

### Tagging Services

```php
public function register(): void
{
    $this->app->bind(RedisReport::class);
    $this->app->bind(NullReport::class);

    $this->app->tag([RedisReport::class, NullReport::class], 'reports');
}
```

## Dependency Injection

### Constructor Injection

```php
// app/Http/Controllers/VehicleController.php
namespace App\Http\Controllers;

use App\Services\VehicleService;
use Illuminate\Http\Request;

class VehicleController extends Controller
{
    protected $vehicleService;

    public function __construct(VehicleService $vehicleService)
    {
        $this->vehicleService = $vehicleService;
    }

    public function index()
    {
        return $this->vehicleService->getAll();
    }
}
```

### Method Injection

```php
public function update(Request $request, VehicleService $vehicleService, $id)
{
    return $vehicleService->update($id, $request->all());
}
```

### Type-Hinting in Routes

```php
Route::get('/vehicles/{vehicle}', function (Vehicle $vehicle) {
    return $vehicle;
});
```

## Boot Method

```php
public function boot(): void
{
    // Register blade directives
    Blade::directive('datetime', function ($expression) {
        return "<?php echo ($expression)->format('m/d/Y H:i'); ?>";
    });

    // Publish configuration
    $this->publishes([
        __DIR__.'/../config/vehicle.php' => config_path('vehicle.php'),
    ], 'vehicle-config');

    // Load views
    $this->loadViewsFrom(__DIR__.'/../resources/views', 'vehicles');

    // Load migrations
    $this->loadMigrationsFrom(__DIR__.'/../database/migrations');

    // Load routes
    $this->loadRoutesFrom(__DIR__.'/../routes/web.php');

    // Register policies
    Gate::policy(Vehicle::class, VehiclePolicy::class);

    // Register event listeners
    Event::listen(OrderCreated::class, SendOrderEmail::class);

    // Register macros
    Response::macro('success', function ($data) {
        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    });
}
```

## Deferred Providers

```php
// app/Providers/VehicleServiceProvider.php
namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class VehicleServiceProvider extends ServiceProvider
{
    protected $defer = true;

    public function register(): void
    {
        $this->app->singleton(VehicleService::class);
    }

    public function provides(): array
    {
        return [VehicleService::class];
    }
}
```

## Facades

### Creating Facades

```bash
# Create facade
php artisan make:facade Vehicle
```

```php
// app/Facades/Vehicle.php
namespace App\Facades;

use Illuminate\Support\Facades\Facade;

class Vehicle extends Facade
{
    protected static function getFacadeAccessor()
    {
        return 'vehicle';
    }
}
```

```php
// Register in provider
public function register(): void
{
    $this->app->bind('vehicle', VehicleService::class);
}
```

```php
// Use facade
use App\Facades\Vehicle;

Vehicle::all();
Vehicle::find(1);
```

## Custom Classes

### Custom Blade Directives

```php
public function boot(): void
{
    Blade::if('admin', function () {
        return auth()->check() && auth()->user()->isAdmin();
    });

    // Usage in blade
    // @admin
    //     <p>Admin content</p>
    // @endadmin
}
```

### Custom Validation Rules

```php
public function boot(): void
{
    Rule::macro('frenchLicensePlate', function () {
        return Rule::matches('/^[A-Z]{2}-\d{3}-[A-Z]{2}$/');
    });

    // Usage
    // 'license_plate' => ['required', 'french_license_plate']
}
```

### Custom Response Macros

```php
public function boot(): void
{
    Response::macro('api', function ($data, $message = null) {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data,
        ]);
    });

    // Usage
    // return response()->api($user, 'User created');
}
```

### Custom Collection Macros

```php
public function boot(): void
{
    Collection::macro('toUpper', function () {
        return $this->map(function ($item) {
            return strtoupper($item);
        });
    });

    // Usage
    // collect(['hello', 'world'])->toUpper(); // ['HELLO', 'WORLD']
}
```

## Service Container Helpers

```php
// Resolve from container
$vehicleService = app(VehicleService::class);
$vehicleService = resolve(VehicleService::class);
$vehicleService = app()['App\Services\VehicleService'];

// Check if bound
if ($this->app->bound(VehicleService::class)) {
    // ...
}

// Check if shared
if ($this->app->isShared(VehicleService::class)) {
    // ...
}

// Get alias
$this->app->alias(VehicleService::class, 'vehicle');

// Call with dependencies
$result = $this->app->call([VehicleController::class, 'index']);

// Make with parameters
$vehicle = $this->app->make(VehicleService::class, ['param' => 'value']);
```

## Best Practices

1. **Register in register()**: Bind services in register()
2. **Boot in boot()**: Use framework features in boot()
3. **Use singletons**: For stateless services
4. **Interface binding**: Bind interfaces to implementations
5. **Lazy load**: Use deferred providers when possible
6. **Testability**: Inject dependencies, don't use facades in classes
7. **Organize providers**: Group by feature/domain
8. **Avoid app() calls**: Use constructor injection instead
9. **Share providers**: Make providers reusable
10. **Document**: Add comments for complex bindings

## Common Patterns

### Repository Pattern

```php
// Contract
// app/Contracts/VehicleRepositoryInterface.php
namespace App\Contracts;

interface VehicleRepositoryInterface
{
    public function all();
    public function find($id);
    public function create(array $data);
}

// Implementation
// app/Repositories/DatabaseVehicleRepository.php
namespace App\Repositories;

use App\Contracts\VehicleRepositoryInterface;
use App\Models\Vehicle;

class DatabaseVehicleRepository implements VehicleRepositoryInterface
{
    public function all()
    {
        return Vehicle::all();
    }

    public function find($id)
    {
        return Vehicle::find($id);
    }

    public function create(array $data)
    {
        return Vehicle::create($data);
    }
}

// Bind in provider
public function register(): void
{
    $this->app->bind(
        VehicleRepositoryInterface::class,
        DatabaseVehicleRepository::class
    );
}

// Inject in controller
public function __construct(VehicleRepositoryInterface $repository)
{
    $this->repository = $repository;
}
```

### Configuration Publishing

```php
public function boot(): void
{
    if ($this->app->runningInConsole()) {
        $this->publishes([
            __DIR__.'/../config/vehicle.php' => config_path('vehicle.php'),
        ], 'vehicle-config');

        $this->publishes([
            __DIR__.'/../database/migrations/' => database_path('migrations'),
        ], 'vehicle-migrations');
    }
}
```

### Event Discovery

```php
public function boot(): void
{
    // Auto-discover event listeners
    $this->app->register(EventServiceProvider::class);
}
```

### View Composer

```php
public function boot(): void
{
    View::composer('vehicles.*', function ($view) {
        $view->with('makes', Vehicle::select('make')->distinct()->pluck('make'));
    });

    // Or with class
    View::composer('vehicles.*', VehicleComposer::class);
}
```
