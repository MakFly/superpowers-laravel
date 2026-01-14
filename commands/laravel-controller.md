---
name: /laravel-controller
description: Generate controller with request validation
---

# Laravel Controller Generator

I'll help you create a controller with form request validation.

## Usage

```bash
# Generate controller
php artisan make:controller VehicleController

# Generate controller with methods
php artisan make:controller VehicleController --resource

# Generate controller with model
php artisan make:controller VehicleController --model=Vehicle --requests
```

## Example Controller Structure

```php
// app/Http/Controllers/VehicleController.php
namespace App\Http\Controllers;

use App\Models\Vehicle;
use App\Http\Requests\StoreVehicleRequest;
use App\Http\Requests\UpdateVehicleRequest;
use App\Http\Resources\VehicleResource;
use Illuminate\Http\JsonResponse;

class VehicleController extends Controller
{
    public function index()
    {
        $vehicles = Vehicle::with(['user', 'images'])
            ->latest()
            ->paginate(15);

        return VehicleResource::collection($vehicles);
    }

    public function store(StoreVehicleRequest $request)
    {
        $vehicle = Vehicle::create($request->validated());

        return new VehicleResource($vehicle)
            ->response()
            ->setStatusCode(201);
    }

    public function show(Vehicle $vehicle)
    {
        return new VehicleResource($vehicle->load(['user', 'images']));
    }

    public function update(UpdateVehicleRequest $request, Vehicle $vehicle)
    {
        $vehicle->update($request->validated());

        return new VehicleResource($vehicle);
    }

    public function destroy(Vehicle $vehicle)
    {
        $vehicle->delete();

        return response()->json(null, 204);
    }
}
```

## Form Request Validation

```php
// app/Http/Requests/StoreVehicleRequest.php
namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreVehicleRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'make' => ['required', 'string', 'max:100'],
            'model' => ['required', 'string', 'max:100'],
            'year' => ['required', 'integer', 'min:1900', 'max:' . (date('Y') + 1)],
            'price' => ['required', 'numeric', 'min:0'],
            'status' => ['in:active,sold,pending'],
        ];
    }
}
```

What controller would you like me to create?
1. Provide the controller name
2. Tell me what methods/CRUD operations it needs
3. I'll generate the complete code
