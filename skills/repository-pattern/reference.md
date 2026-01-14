# Reference

---
name: laravel:repository-pattern
description: Repository pattern implementation for Laravel applications
---

# Repository Pattern in Laravel

## Why Repository Pattern?

- **Abstraction**: Decouple business logic from data access
- **Testability**: Mock repositories for testing
- **Flexibility**: Switch data sources (Eloquent, API, etc.)
- **Reusability**: Share logic across the application

## Basic Structure

```
app/
├── Contracts/
│   └── VehicleRepositoryInterface.php
├── Repositories/
│   ├── AbstractRepository.php
│   ├── VehicleRepository.php
│   └── Eloquent/
│       └── EloquentVehicleRepository.php
```

## Contract Interface

```php
// app/Contracts/VehicleRepositoryInterface.php
namespace App\Contracts;

interface VehicleRepositoryInterface
{
    public function all();
    public function find($id);
    public function findOrFail($id);
    public function create(array $data);
    public function update($id, array $data);
    public function delete($id);
    public function paginate($perPage = 15);
    public function where($column, $operator, $value = null);
    public function with($relations);
}
```

## Abstract Repository

```php
// app/Repositories/AbstractRepository.php
namespace App\Repositories;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Pagination\LengthAwarePaginator;

abstract class AbstractRepository
{
    protected Model $model;

    public function all()
    {
        return $this->model->all();
    }

    public function find($id)
    {
        return $this->model->find($id);
    }

    public function findOrFail($id)
    {
        return $this->model->findOrFail($id);
    }

    public function create(array $data)
    {
        return $this->model->create($data);
    }

    public function update($id, array $data)
    {
        $record = $this->findOrFail($id);
        $record->update($data);
        return $record;
    }

    public function delete($id)
    {
        $record = $this->findOrFail($id);
        return $record->delete();
    }

    public function paginate($perPage = 15): LengthAwarePaginator
    {
        return $this->model->paginate($perPage);
    }

    public function where($column, $operator = null, $value = null)
    {
        return $this->model->where($column, $operator, $value);
    }

    public function with($relations)
    {
        return $this->model->with($relations);
    }

    public function withTrashed()
    {
        return $this->model->withTrashed();
    }

    public function onlyTrashed()
    {
        return $this->model->onlyTrashed();
    }
}
```

## Eloquent Implementation

```php
// app/Repositories/Eloquent/EloquentVehicleRepository.php
namespace App\Repositories\Eloquent;

use App\Contracts\VehicleRepositoryInterface;
use App\Models\Vehicle;
use App\Repositories\AbstractRepository;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;

class EloquentVehicleRepository extends AbstractRepository implements VehicleRepositoryInterface
{
    public function __construct(Vehicle $model)
    {
        $this->model = $model;
    }

    public function search(string $query)
    {
        return $this->model
            ->where('make', 'like', "%{$query}%")
            ->orWhere('model', 'like', "%{$query}%")
            ->get();
    }

    public function filterByMake(string $make): Builder
    {
        return $this->model->where('make', $make);
    }

    public function filterByPriceRange(int $min, int $max): Builder
    {
        return $this->model->whereBetween('price', [$min, $max]);
    }

    public function findBySlug(string $slug)
    {
        return $this->model->where('slug', $slug)->firstOrFail();
    }

    public function paginatedWithFilters(array $filters, int $perPage = 15): LengthAwarePaginator
    {
        $query = $this->model->query();

        if (isset($filters['make'])) {
            $query->where('make', $filters['make']);
        }

        if (isset($filters['min_price'])) {
            $query->where('price', '>=', $filters['min_price']);
        }

        if (isset($filters['max_price'])) {
            $query->where('price', '<=', $filters['max_price']);
        }

        if (isset($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('make', 'like', "%{$filters['search']}%")
                  ->orWhere('model', 'like', "%{$filters['search']}%");
            });
        }

        return $query->with(['user', 'images'])
            ->latest()
            ->paginate($perPage);
    }

    public function getAvailable()
    {
        return $this->model->where('status', 'available')->get();
    }

    public function getByUser(int $userId)
    {
        return $this->model->where('user_id', $userId)->get();
    }
}
```

## Service Provider Binding

```php
// app/Providers/AppServiceProvider.php
namespace App\Providers;

use App\Contracts\VehicleRepositoryInterface;
use App\Repositories\Eloquent\EloquentVehicleRepository;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(VehicleRepositoryInterface::class, EloquentVehicleRepository::class);
    }

    public function boot(): void
    {
        //
    }
}
```

## Using in Controller

```php
// app/Http/Controllers/VehicleController.php
namespace App\Http\Controllers;

use App\Contracts\VehicleRepositoryInterface;
use App\Http\Requests\StoreVehicleRequest;
use App\Http\Resources\VehicleResource;
use Illuminate\Http\Request;

class VehicleController extends Controller
{
    protected VehicleRepositoryInterface $repository;

    public function __construct(VehicleRepositoryInterface $repository)
    {
        $this->repository = $repository;
    }

    public function index()
    {
        $vehicles = $this->repository->paginatedWithFilters(
            request()->all(),
            15
        );

        return VehicleResource::collection($vehicles);
    }

    public function show($id)
    {
        $vehicle = $this->repository->findOrFail($id);

        return new VehicleResource($vehicle);
    }

    public function store(StoreVehicleRequest $request)
    {
        $vehicle = $this->repository->create($request->validated());

        return new VehicleResource($vehicle);
    }

    public function update(Request $request, $id)
    {
        $vehicle = $this->repository->update($id, $request->all());

        return new VehicleResource($vehicle);
    }

    public function destroy($id)
    {
        $this->repository->delete($id);

        return response()->json(null, 204);
    }
}
```

## Caching Repository

```php
// app/Repositories/Caching/CachingVehicleRepository.php
namespace App\Repositories\Caching;

use App\Contracts\VehicleRepositoryInterface;
use Illuminate\Support\Facades\Cache;

class CachingVehicleRepository implements VehicleRepositoryInterface
{
    protected VehicleRepositoryInterface $repository;
    protected int $cacheTTL = 3600; // 1 hour

    public function __construct(VehicleRepositoryInterface $repository)
    {
        $this->repository = $repository;
    }

    public function find($id)
    {
        return Cache::remember("vehicle:{$id}", $this->cacheTTL, function () use ($id) {
            return $this->repository->find($id);
        });
    }

    public function findOrFail($id)
    {
        return Cache::remember("vehicle:{$id}", $this->cacheTTL, function () use ($id) {
            return $this->repository->findOrFail($id);
        });
    }

    public function create(array $data)
    {
        $vehicle = $this->repository->create($data);
        Cache::put("vehicle:{$vehicle->id}", $vehicle, $this->cacheTTL);
        return $vehicle;
    }

    public function update($id, array $data)
    {
        $vehicle = $this->repository->update($id, $data);
        Cache::put("vehicle:{$id}", $vehicle, $this->cacheTTL);
        return $vehicle;
    }

    public function delete($id)
    {
        Cache::forget("vehicle:{$id}");
        return $this->repository->delete($id);
    }

    public function paginate($perPage = 15)
    {
        return Cache::remember("vehicles:page:{$perPage}", $this->cacheTTL, function () use ($perPage) {
            return $this->repository->paginate($perPage);
        });
    }

    // Delegate other methods
    public function __call($method, $arguments)
    {
        return $this->repository->$method(...$arguments);
    }
}
```

## Decorator Pattern

```php
// app/Repositories/Decorators/LoggingVehicleRepository.php
namespace App\Repositories\Decorators;

use App\Contracts\VehicleRepositoryInterface;
use Illuminate\Support\Facades\Log;

class LoggingVehicleRepository implements VehicleRepositoryInterface
{
    protected VehicleRepositoryInterface $repository;

    public function __construct(VehicleRepositoryInterface $repository)
    {
        $this->repository = $repository;
    }

    public function create(array $data)
    {
        Log::info('Creating vehicle', $data);
        return $this->repository->create($data);
    }

    public function update($id, array $data)
    {
        Log::info('Updating vehicle', ['id' => $id, 'data' => $data]);
        return $this->repository->update($id, $data);
    }

    public function delete($id)
    {
        Log::info('Deleting vehicle', ['id' => $id]);
        return $this->repository->delete($id);
    }

    public function __call($method, $arguments)
    {
        return $this->repository->$method(...$arguments);
    }
}
```

## Multiple Data Sources

```php
// app/Repositories/API/APIVehicleRepository.php
namespace App\Repositories\API;

use App\Contracts\VehicleRepositoryInterface;
use Illuminate\Support\Facades\Http;

class APIVehicleRepository implements VehicleRepositoryInterface
{
    protected string $baseUrl;

    public function __construct()
    {
        $this->baseUrl = config('services.vehicles.api_url');
    }

    public function all()
    {
        $response = Http::get("{$this->baseUrl}/vehicles");
        return $response->json();
    }

    public function find($id)
    {
        $response = Http::get("{$this->baseUrl}/vehicles/{$id}");
        return $response->json();
    }

    public function create(array $data)
    {
        $response = Http::post("{$this->baseUrl}/vehicles", $data);
        return $response->json();
    }

    public function update($id, array $data)
    {
        $response = Http::put("{$this->baseUrl}/vehicles/{$id}", $data);
        return $response->json();
    }

    public function delete($id)
    {
        Http::delete("{$this->baseUrl}/vehicles/{$id}");
        return true;
    }

    public function paginate($perPage = 15)
    {
        $response = Http::get("{$this->baseUrl}/vehicles", [
            'per_page' => $perPage
        ]);
        return $response->json();
    }
}
```

## Criteria Pattern

```php
// app/Repositories/Criteria/CriteriaInterface.php
namespace App\Repositories\Criteria;

interface CriteriaInterface
{
    public function apply($model);
}

// app/Repositories/Criteria/ByMake.php
namespace App\Repositories\Criteria;

class ByMake implements CriteriaInterface
{
    protected string $make;

    public function __construct(string $make)
    {
        $this->make = $make;
    }

    public function apply($model)
    {
        return $model->where('make', $this->make);
    }
}

// app/Repositories/Criteria/ByPriceRange.php
namespace App\Repositories\Criteria;

class ByPriceRange implements CriteriaInterface
{
    protected int $min;
    protected int $max;

    public function __construct(int $min, int $max)
    {
        $this->min = $min;
        $this->max = $max;
    }

    public function apply($model)
    {
        return $model->whereBetween('price', [$this->min, $this->max]);
    }
}
```

```php
// In repository
use App\Repositories\Criteria\ByMake;
use App\Repositories\Criteria\ByPriceRange;

public function findByCriteria(array $criteria)
{
    $query = $this->model->query();

    foreach ($criteria as $criterion) {
        $query = $criterion->apply($query);
    }

    return $query->get();
}

// Usage
$criteria = [
    new ByMake('Tesla'),
    new ByPriceRange(30000, 60000),
];

$vehicles = $repository->findByCriteria($criteria);
```

## Best Practices

1. **Interface-first**: Always program to interfaces
2. **Single responsibility**: One repository per entity
3. **Keep it simple**: Don't over-abstract
4. **Use caching**: Add caching layer separately
5. **Test repositories**: Mock interfaces in tests
6. **Type hints**: Use return types and parameter types
7. **DocBlocks**: Document methods clearly
8. **Lazy loading**: Use with() for relations
9. **Validation**: Validate before repository calls
10. **Error handling**: Handle exceptions appropriately

## Common Patterns

### With Scopes

```php
public function getActive()
{
    return $this->model->active()->get();
}

public function getPublished()
{
    return $this->model->published()->get();
}
```

### Bulk Operations

```php
public function bulkCreate(array $items)
{
    return $this->model->insert($items);
}

public function bulkUpdate(array $ids, array $data)
{
    return $this->model->whereIn('id', $ids)->update($data);
}

public function bulkDelete(array $ids)
{
    return $this->model->whereIn('id', $ids)->delete();
}
```

### Count Queries

```php
public function count(): int
{
    return $this->model->count();
}

public function countByStatus(string $status): int
{
    return $this->model->where('status', $status)->count();
}
```

### Existence Checks

```php
public function exists($id): bool
{
    return $this->model->where('id', $id)->exists();
}

public function hasActiveVehicles(): bool
{
    return $this->model->active()->exists();
}
```
