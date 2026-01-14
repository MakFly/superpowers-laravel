---
name: /laravel-api-resource
description: Generate API Resource
---

# Laravel API Resource Generator

I'll help you create an API Resource for transforming data.

## Usage

```bash
# Generate resource
php artisan make:resource VehicleResource

# Generate resource collection
php artisan make:resource VehicleCollection

# Generate resource without collection
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
            'formatted_price' => '€' . number_format($this->price, 2),
            'status' => $this->status,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
```

## Resource with Relationships

```php
// app/Http/Resources/VehicleResource.php
use App\Http\Resources\UserResource;
use App\Http\Resources\VehicleImageResource;

public function toArray(Request $request): array
{
    return [
        'id' => $this->id,
        'make' => $this->make,
        'model' => $this->model,
        'price' => $this->price,

        // Include relationships
        'seller' => new UserResource($this->whenLoaded('user')),
        'images' => VehicleImageResource::collection($this->whenLoaded('images')),

        // Conditional fields
        'admin_notes' => $this->when($request->user()?->isAdmin(), $this->admin_notes),

        'created_at' => $this->created_at,
    ];
}
```

## Resource Collection

```php
// app/Http/Resources/VehicleCollection.php
namespace App\Http\Resources;

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
```

## Using Resources

```php
// In controller
use App\Http\Resources\VehicleResource;
use App\Http\Resources\VehicleCollection;
use App\Models\Vehicle;

// Single item
public function show(Vehicle $vehicle)
{
    return new VehicleResource($vehicle);
}

// Collection
public function index()
{
    $vehicles = Vehicle::all();
    return VehicleResource::collection($vehicles);
}

// With pagination
public function index()
{
    $vehicles = Vehicle::paginate(15);
    return new VehicleCollection($vehicles);
}

// With additional data
public function index()
{
    $vehicles = Vehicle::paginate(15);
    return VehicleResource::collection($vehicles)
        ->additional([
            'meta' => [
                'filters' => ['make', 'model', 'year'],
            ]
        ]);
}
```

## Conditional Attributes

```php
public function toArray(Request $request): array
{
    return [
        'id' => $this->id,
        'make' => $this->make,

        // Only include if loaded
        'seller' => new UserResource($this->whenLoaded('user')),

        // Include when condition is true
        'secret' => $this->when($request->user()?->isAdmin(), function () {
            return $this->secret_data;
        }),

        // Merge when
    ] + $this->when($request->user()?->isAdmin(), [
        'admin_notes' => $this->admin_notes,
    ]);
}
```

What resource would you like to create?
1. Tell me the model name
2. Describe what fields and relationships to include
3. I'll generate the resource code
