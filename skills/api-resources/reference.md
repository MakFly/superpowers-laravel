# Reference

---
name: laravel:api-resources
description: API Resources for JSON transformation
---

# Laravel API Resources

## Creating Resources

```bash
# Create resource
php artisan make:resource VehicleResource

# Create collection resource
php artisan make:resource VehicleCollection

# Create resource without collection
php artisan make:resource VehicleResource --collection
```

## Basic Resource

```php
// app/Http/Resources/VehicleResource.php
namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VehicleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'make' => $this->make,
            'model' => $this->model,
            'year' => $this->year,
            'price' => $this->price,
            'status' => $this->status,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
```

## Using Resources

```php
// Single item
use App\Http\Resources\VehicleResource;
use App\Models\Vehicle;

public function show($id)
{
    $vehicle = Vehicle::findOrFail($id);
    return new VehicleResource($vehicle);
}

// Collection
public function index()
{
    $vehicles = Vehicle::all();
    return VehicleResource::collection($vehicles);
}

// Pagination
public function index()
{
    $vehicles = Vehicle::paginate(15);
    return VehicleResource::collection($vehicles);
}
```

## Resource Collections

```php
// app/Http/Resources/VehicleCollection.php
namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;

class VehicleCollection extends ResourceCollection
{
    public function toArray(Request $request): array
    {
        return [
            'data' => $this->collection,
            'meta' => [
                'total' => $this->total(),
                'per_page' => $this->perPage(),
                'current_page' => $this->currentPage(),
                'last_page' => $this->lastPage(),
            ],
        ];
    }
}

// Usage
public function index()
{
    $vehicles = Vehicle::paginate(15);
    return new VehicleCollection($vehicles);
}
```

## Conditional Attributes

```php
public function toArray(Request $request): array
{
    return [
        'id' => $this->id,
        'make' => $this->make,
        'model' => $this->model,
        'price' => $this->when($request->user()->isAdmin(), 'admin_price'),
        'secret' => $this->when($request->user()->isAdmin(), function () {
            return 'secret-data';
        }),
    ];
}

// Or merge when
public function toArray(Request $request): array
{
    return [
        'id' => $this->id,
        'make' => $this->make,
        'model' => $this->model,
    ] + $this->when($request->user()->isAdmin(), [
        'admin_notes' => $this->admin_notes,
    ]);
}
```

## Conditional Inclusion

```php
// VehicleResource.php
public function toArray(Request $request): array
{
    return [
        'id' => $this->id,
        'make' => $this->make,
        'model' => $this->model,
        'price' => $this->whenLoaded('price'),
        'seller' => new UserResource($this->whenLoaded('user')),
        'reviews' => ReviewResource::collection($this->whenLoaded('reviews')),
    ];
}

// Usage
$vehicle = Vehicle::with('user', 'reviews')->find(1);
return new VehicleResource($vehicle);

// Or conditionally merge
VehicleResource::make($vehicle)->additional([
    'meta' => [
        'featured' => $vehicle->is_featured,
    ]
]);
```

## Wrapping

```php
// Disable wrapping (data key)
// app/Http/Resources/VehicleResource.php
public $wrap = 'vehicle';

// Or disable globally
// app/Providers/AppServiceProvider.php
use Illuminate\Http\Resources\Json\JsonResource;

public function boot(): void
{
    JsonResource::withoutWrapping();
}
```

## Nested Resources

```php
public function toArray(Request $request): array
{
    return [
        'id' => $this->id,
        'make' => $this->make,
        'model' => $this->model,
        'user' => new UserResource($this->user),
        'comments' => CommentResource::collection($this->comments),
    ];
}
```

## Pagination Meta

```php
// app/Http/Resources/VehicleCollection.php
public function toArray(Request $request): array
{
    return [
        'data' => $this->collection,
        'links' => [
            'first' => $this->url(1),
            'last' => $this->url($this->lastPage()),
            'prev' => $this->previousPageUrl(),
            'next' => $this->nextPageUrl(),
        ],
        'meta' => [
            'current_page' => $this->currentPage(),
            'from' => $this->firstItem(),
            'last_page' => $this->lastPage(),
            'per_page' => $this->perPage(),
            'to' => $this->lastItem(),
            'total' => $this->total(),
        ],
    ];
}
```

## Custom Response

```php
// app/Http/Resources/VehicleResource.php
use Illuminate\Http\JsonResponse;

public function toResponse($request): JsonResponse
{
    return parent::toResponse($request)
        ->setStatusCode(200)
        ->header('X-Custom', 'Value');
}
```

## Accessing Request

```php
public function toArray(Request $request): array
{
    return [
        'id' => $this->id,
        'make' => $this->make,
        'editable' => $request->user()?->can('update', $this->resource),
    ];
}
```

## Resource Responses

```php
// app/Http/Responses/VehicleResponse.php
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\JsonResource;

class VehicleResponse extends JsonResponse
{
    public function __construct(JsonResource $resource)
    {
        parent::__construct(
            $resource->resolve(),
            200,
            [
                'X-Resource' => 'Vehicle',
            ],
            0
        );
    }
}
```

## Best Practices

1. **Format in resource**: Keep formatting logic in resources
2. **Use conditions**: Only include what's needed
3. **Eager load relations**: Use whenLoaded() to avoid N+1
4. **Keep models separate**: Don't mix model logic
5. **Version your APIs**: Create v1/VehicleResource, v2/VehicleResource
6. **Use collections**: For list responses
7. **Document**: Keep resources documented

## Common Patterns

### API Response Structure

```php
// app/Http/Resources/ApiResource.php
abstract class ApiResource extends JsonResource
{
    protected function success($data, $message = null)
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data,
        ]);
    }

    protected function error($message, $code = 400)
    {
        return response()->json([
            'success' => false,
            'message' => $message,
        ], $code);
    }
}

// Usage
class VehicleResource extends ApiResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'make' => $this->make,
        ];
    }
}
```

### Meta Information

```php
public function toArray(Request $request): array
{
    return [
        'data' => [
            'id' => $this->id,
            'make' => $this->make,
            'model' => $this->model,
        ],
        'meta' => [
            'can_update' => $request->user()?->can('update', $this->resource),
            'can_delete' => $request->user()?->can('delete', $this->resource),
        ],
    ];
}
```

### Filtered Fields

```php
// Only return requested fields
public function toArray(Request $request): array
{
    $fields = $request->query('fields', '*');
    $data = [
        'id' => $this->id,
        'make' => $this->make,
        'model' => $this->model,
        'price' => $this->price,
    ];

    if ($fields !== '*') {
        $requested = explode(',', $fields);
        return array_intersect_key($data, array_flip($requested));
    }

    return $data;
}
```
