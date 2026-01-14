# Reference

---
name: laravel:requests-validation
description: Form Request validation for Laravel applications
---

# Form Request Validation

## Creating Form Requests

```bash
# Create form request
php artisan make:request StoreVehicleRequest
php artisan make:request UpdateVehicleRequest
```

## Basic Form Request

```php
// app/Http/Requests/StoreVehicleRequest.php
namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreVehicleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Or implement auth logic
    }

    public function rules(): array
    {
        return [
            'make' => ['required', 'string', 'max:100'],
            'model' => ['required', 'string', 'max:100'],
            'year' => ['required', 'integer', 'min:1900', 'max:' . (date('Y') + 1)],
            'price' => ['required', 'numeric', 'min:0'],
            'description' => ['nullable', 'string'],
            'status' => ['in:active,sold,pending'],
        ];
    }
}
```

## Using Form Requests

```php
// app/Http/Controllers/VehicleController.php
use App\Http\Requests\StoreVehicleRequest;
use App\Http\Requests\UpdateVehicleRequest;

class VehicleController extends Controller
{
    public function store(StoreVehicleRequest $request)
    {
        // Validation already passed
        $vehicle = Vehicle::create($request->validated());

        return new VehicleResource($vehicle);
    }

    public function update(UpdateVehicleRequest $request, Vehicle $vehicle)
    {
        $vehicle->update($request->validated());

        return new VehicleResource($vehicle);
    }
}
```

## Authorization

```php
public function authorize(): bool
{
    // Simple check
    return auth()->check();

    // With policy
    return $this->user()->can('create', Vehicle::class);

    // With custom logic
    $vehicle = Vehicle::find($this->route('vehicle'));
    return $vehicle && $this->user()->id === $vehicle->user_id;
}
```

## Custom Error Messages

```php
public function messages(): array
{
    return [
        'make.required' => 'The make field is required.',
        'year.min' => 'The year must be after 1900.',
        'price.numeric' => 'The price must be a number.',
    ];
}
```

## Custom Attributes

```php
public function attributes(): array
{
    return [
        'make' => 'vehicle make',
        'model' => 'vehicle model',
        'price' => 'vehicle price',
    ];
}
```

## Validation Rules

```php
// Required
'field' => 'required'

// Nullable
'field' => 'nullable'

// String
'field' => 'string|max:255|min:5'

// Integer
'field' => 'integer|min:1|max:100'

// Numeric
'field' => 'numeric|min:0|max:999999.99'

// Email
'email' => 'required|email|unique:users,email'

// URL
'website' => 'nullable|url'

// Date
'birthday' => 'required|date|before:today'
'published_at' => 'required|date|after:now'

// File
'avatar' => 'nullable|image|max:2048' // Max 2MB
'document' => 'nullable|mimes:pdf,doc,docx|max:5120'

// Array
'tags' => 'array|max:5'
'tags.*' => 'string|max:50'

// Confirmed (password_confirmation field)
'password' => 'required|min:8|confirmed'

// Exists in database
'user_id' => 'required|exists:users,id'

// Unique
'email' => 'required|email|unique:users,email'
// Ignore on update
'email' => 'required|email|unique:users,email,' . $this->user->id

// Regular expression
'license_plate' => 'required|regex:/^[A-Z]{2}-\d{3}-[A-Z]{2}$/'

// In array
'status' => 'required|in:active,pending,sold'

// Multiple rules
'field' => ['required', 'string', 'min:5', 'max:255']
```

## Conditional Validation

```php
public function rules(): array
{
    return [
        'type' => ['required', 'in:individual,company'],
        'company_name' => ['required_if:type,company'],
        'siret' => ['required_if:type,company', 'regex:/^\d{14}$/'],
        'birth_date' => ['required_if:type,individual', 'date', 'before:today'],
    ];
}

// Or with conditional
public function rules(): array
{
    $rules = [
        'type' => ['required'],
    ];

    if ($this->type === 'company') {
        $rules['company_name'] = ['required'];
        $rules['siret'] = ['required', 'regex:/^\d{14}$/'];
    }

    return $rules;
}
```

## Validating Arrays

```php
public function rules(): array
{
    return [
        'vehicles' => ['required', 'array', 'max:10'],
        'vehicles.*.make' => ['required', 'string'],
        'vehicles.*.model' => ['required', 'string'],
        'vehicles.*.year' => ['required', 'integer'],
    ];
}

// Data structure
[
    'vehicles' => [
        ['make' => 'Tesla', 'model' => 'Model 3', 'year' => 2023],
        ['make' => 'Renault', 'model' => 'Clio', 'year' => 2022],
    ]
]
```

## Custom Validation Rules

```bash
# Create custom rule
php artisan make:rule FrenchLicensePlate
```

```php
// app/Rules/FrenchLicensePlate.php
namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class FrenchLicensePlate implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (!preg_match('/^[A-Z]{2}-\d{3}-[A-Z]{2}$/', $value)) {
            $fail('The :attribute must be a valid French license plate.');
        }
    }
}

// Usage
public function rules(): array
{
    return [
        'license_plate' => ['required', new FrenchLicensePlate],
    ];
}
```

## Request Object Methods

```php
public function rules(): array
{
    return [
        // Access route parameters
        'vehicle_id' => 'required|exists:vehicles,id',
    ];
}

public function authorize(): bool
{
    // Access route parameters
    $vehicle = Vehicle::find($this->route('vehicle'));

    // Access JSON data
    $data = $this->json()->all();

    // Check if has field
    if ($this->has('special_field')) {
        // Do something
    }

    return true;
}
```

## Preparing Input

```php
protected function prepareForValidation(): void
{
    $this->merge([
        'slug' => Str::slug($this->title),
        'price' => $this->price * 100, // Convert to cents
    ]);
}
```

## After Validation Hook

```php
protected function passedValidation(): void
{
    // After validation passes
    $this->replace([
        'price' => (int) $this->price * 100,
    ]);
}
```

## Handling Validation Errors

```php
// In controller (if not using form request)
public function store(Request $request)
{
    $validated = $request->validate([
        'make' => 'required|string',
        'model' => 'required|string',
    ]);

    // Or with custom response
    $validated = $request->validateWithBag('post', [
        'title' => 'required|unique:posts|max:255',
        'body' => 'required',
    ]);

    // Manual validation
    $validator = Validator::make($request->all(), [
        'title' => 'required',
        'body' => 'required',
    ]);

    if ($validator->fails()) {
        return redirect('post/create')
            ->withErrors($validator)
            ->withInput();
    }
}
```

## API Validation Response

```php
// app/Exceptions/Handler.php
use Illuminate\Validation\ValidationException;

public function register(): void
{
    ValidationException::reformat(function (ValidationException $exception) {
        $errors = [];
        foreach ($exception->errors() as $field => $messages) {
            $errors[$field] = $messages[0];
        }

        $exception->responseObject = response()->json([
            'success' => false,
            'message' => 'Validation failed',
            'errors' => $errors,
        ], 422);
    });
}
```

## Best Practices

1. **Always validate**: Never trust user input
2. **Use form requests**: Keep controllers clean
3. **Authorization in request**: Check permissions here
4. **Custom messages**: Improve UX
5. **Strong typing**: Use typed arrays
6. **Validation in tests**: Test validation rules
7. **API-friendly**: Return JSON for APIs

## Common Patterns

### Unique on Update

```php
public function rules(): array
{
    return [
        'email' => [
            'required',
            'email',
            Rule::unique('users')->ignore($this->user),
        ],
        'slug' => [
            'required',
            Rule::unique('vehicles', 'slug')->ignore($this->route('vehicle')),
        ],
    ];
}
```

### Conditional Validation

```php
public function rules(): array
{
    return [
        'password' => [
            'required',
            'string',
            'min:8',
            'confirmed',
            Rule::requiredIf(fn () => $this->is_new),
        ],
    ];
}
```

### File Upload

```php
public function rules(): array
{
    return [
        'avatar' => [
            'nullable',
            'image',
            'max:2048', // 2MB
            'dimensions:max_width=1920,max_height=1080',
        ],
        'documents' => [
            'required',
            'array',
            'max:5',
        ],
        'documents.*' => [
            'required',
            'mimes:pdf,doc,docx',
            'max:5120', // 5MB
        ],
    ];
}
```
