# Reference

---
name: laravel:eloquent-casts-accessors
description: Eloquent Attribute Casting and Accessors/Mutators
---

# Eloquent Attribute Casting & Accessors

## Attribute Casting

### Basic Casting

```php
// app/Models/User.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    protected $casts = [
        'is_admin' => 'boolean',
        'price' => 'decimal:2',
        'published_at' => 'datetime',
        'options' => 'array',
        'meta' => 'json',
        'settings' => 'collection',
        'uuid' => 'string',
    ];
}
```

### Cast Types

```php
protected $casts = [
    // Array / JSON
    'metadata' => 'array',
    'options' => 'json',
    'settings' => 'collection', // Returns Collection

    // Date / Time
    'created_at' => 'datetime',
    'published_at' => 'datetime:Y-m-d',
    'expires_at' => 'timestamp',

    // Numbers
    'price' => 'decimal:2',
    'quantity' => 'integer',
    'rating' => 'float',

    // Boolean
    'is_active' => 'boolean',
    'verified' => 'bool',

    // Encrypted
    'ssn' => 'encrypted',
    'api_key' => 'encrypted:array',

    // Hashed (one-way)
    'password' => 'hashed',
];
```

## Custom Casts

```bash
# Create custom cast
php artisan make:cast MoneyCast
```

```php
// app/Casts/MoneyCast.php
namespace App\Casts;

use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use InvalidArgumentException;

class MoneyCast implements CastsAttributes
{
    public function get($model, string $key, $value, array $attributes)
    {
        // Convert from cents to euros
        return $value / 100;
    }

    public function set($model, string $key, $value, array $attributes)
    {
        if (! is_numeric($value)) {
            throw new InvalidArgumentException('The price must be a number.');
        }

        // Convert from euros to cents
        return (int) ($value * 100);
    }
}
```

```php
// app/Models/Vehicle.php
protected $casts = [
    'price' => MoneyCast::class,
];
```

## Castable Objects

```php
// app/ValueObjects/Price.php
namespace App\ValueObjects;

use Illuminate\Contracts\Database\Eloquent\Castable;
use App\Casts\PriceCast;

class Price implements Castable
{
    public function __construct(
        public int $amount,
        public string $currency
    ) {}

    public static function castUsing(array $arguments)
    {
        return new PriceCast();
    }

    public function format(): string
    {
        return number_format($this->amount / 100, 2) . ' ' . $this->currency;
    }
}
```

```php
// app/Casts/PriceCast.php
namespace App\Casts;

use App\ValueObjects\Price;
use Illuminate\Contracts\Database\Eloquent\CastsAttributes;

class PriceCast implements CastsAttributes
{
    public function get($model, string $key, $value, array $attributes): Price
    {
        $data = json_decode($value, true);

        return new Price($data['amount'], $data['currency']);
    }

    public function set($model, string $key, $value, array $attributes): string
    {
        if (! $value instanceof Price) {
            throw new InvalidArgumentException('Value must be a Price instance.');
        }

        return json_encode([
            'amount' => $value->amount,
            'currency' => $value->currency,
        ]);
    }
}
```

## Accessors & Mutators

### Traditional Accessors/Mutators

```php
// app/Models/User.php
namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;

class User extends Model
{
    // Accessor: Get full name
    protected function fullName(): Attribute
    {
        return Attribute::make(
            get: fn () => "{$this->first_name} {$this->last_name}"
        );
    }

    // Mutator: Set password (hash it)
    protected function password(): Attribute
    {
        return Attribute::make(
            set: fn ($value) => bcrypt($value)
        );
    }

    // Both accessor and mutator
    protected function price(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => $value / 100,
            set: fn ($value) => $value * 100
        );
    }
}
```

### Accessor with Computed Value

```php
// Get discounted price
protected function discountedPrice(): Attribute
{
    return Attribute::make(
        get: fn () => $this->price * (1 - $this->discount / 100)
    );
}

// Usage
$vehicle->discounted_price
```

### Mutator with Validation

```php
protected function email(): Attribute
{
    return Attribute::make(
        set: function ($value) {
            if (! filter_var($value, FILTER_VALIDATE_EMAIL)) {
                throw new \InvalidArgumentException('Invalid email address.');
            }

            return strtolower($value);
        }
    );
}
```

## Date Casting

```php
// app/Models/Vehicle.php
class Vehicle extends Model
{
    protected $casts = [
        'purchased_at' => 'datetime',
        'expires_at' => 'datetime:Y-m-d H:i:s',
    ];

    // Custom date format
    protected function serializeDate(DateTimeInterface $date)
    {
        return $date->format('Y-m-d');
    }
}
```

## Enum Casting

```php
// app/Enums/VehicleStatus.php
namespace App\Enums;

enum VehicleStatus: string
{
    case Active = 'active';
    case Sold = 'sold';
    case Pending = 'pending';
}
```

```php
// app/Models/Vehicle.php
class Vehicle extends Model
{
    protected $casts = [
        'status' => VehicleStatus::class,
    ];
}
```

```php
// Usage
$vehicle = Vehicle::first();
$vehicle->status; // VehicleStatus::Active

$vehicle->status = VehicleStatus::Sold;
$vehicle->save();

// In queries
Vehicle::where('status', VehicleStatus::Active)->get();
```

## Array/JSON Casting

```php
// app/Models/User.php
protected $casts = [
    'metadata' => 'array',
];

// Usage
$user->metadata = ['key' => 'value'];
$user->save();

$user->metadata; // ['key' => 'value']
$user->metadata['key']; // 'value'

// Update specific key
$user->update(['metadata->key' => 'new value']);
```

## Accessing Raw Values

```php
// Get original value before casting
$vehicle->getOriginal('price');

// Get all original values
$vehicle->getOriginal();

// Check if attribute was changed
$vehicle->isDirty('price');
$vehicle->isDirty();

// Get dirty attributes
$vehicle->getDirty();
```

## Best Practices

1. **Use casts**: For type conversions
2. **Use accessors**: For computed values
3. **Use mutators**: For data transformation
4. **Immutable objects**: Use value objects for complex data
5. **Date formatting**: Cast to datetime with format
6. **Encrypt sensitive**: Use encrypted cast
7. **Validate in mutators**: Throw exceptions for invalid data
8. **Type hints**: Use return types for attributes
9. **Document**: Add comments for complex casting
10. **Test thoroughly**: Test casts and accessors

## Common Patterns

### Money Value Object

```php
// app/ValueObjects/Money.php
namespace App\ValueObjects;

use JsonSerializable;

class Money implements JsonSerializable
{
    public function __construct(
        public readonly int $amount,
        public readonly string $currency = 'EUR'
    ) {}

    public static function fromEuros(float $amount): self
    {
        return new self((int) round($amount * 100));
    }

    public function toEuros(): float
    {
        return $this->amount / 100;
    }

    public function format(): string
    {
        return number_format($this->toEuros(), 2, ',', ' ') . ' €';
    }

    public function jsonSerialize(): array
    {
        return [
            'amount' => $this->amount,
            'currency' => $this->currency,
            'formatted' => $this->format(),
        ];
    }
}
```

### URL Accessor

```php
protected function profileUrl(): Attribute
{
    return Attribute::make(
        get: fn () => route('users.show', $this->slug)
    );
}
```

### Image Path Accessor

```php
protected function imageUrl(): Attribute
{
    return Attribute::make(
        get: fn () => $this->image
            ? Storage::url($this->image)
            : asset('images/default-avatar.png')
    );
}
```

### Slug Mutator

```php
protected function slug(): Attribute
{
    return Attribute::make(
        set: fn ($value) => Str::slug($value)
    );
}
```

### Hashed ID Accessor

```php
protected function hashedId(): Attribute
{
    return Attribute::make(
        get: fn () => HashIds::encode($this->id)
    );
}
```

### Conditional Mutator

```php
protected function phone(): Attribute
{
    return Attribute::make(
        set: function ($value) {
            // Format French phone number
            $value = preg_replace('/[^0-9]/', '', $value);

            if (strlen($value) === 9 && str_starts_with($value, '0')) {
                return $value;
            }

            if (strlen($value) === 10 && str_starts_with($value, '33')) {
                return '0' . substr($value, 2);
            }

            return $value;
        }
    );
}
```

### Computed Accessor

```php
protected function completionPercentage(): Attribute
{
    return Attribute::make(
        get: fn () => collect([
            $this->title,
            $this->description,
            $this->price,
            $this->images,
        ])->filter()->count() / 4 * 100
    );
}
```

### Multiple Mutations

```php
protected function coordinates(): Attribute
{
    return Attribute::make(
        get: fn ($value) => $value ? json_decode($value, true) : null,
        set: fn ($value) => is_array($value) ? json_encode($value) : $value
    );
}
```

### Type Coercion

```php
protected function isPremium(): Attribute
{
    return Attribute::make(
        get: fn ($value) => (bool) $value,
        set: fn ($value) => (int) $value
    );
}
```

### Trim Strings

```php
protected function email(): Attribute
{
    return Attribute::make(
        set: fn ($value) => trim(strtolower($value))
    );
}
```
