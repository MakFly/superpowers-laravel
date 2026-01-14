---
name: /laravel-model
description: Generate Eloquent model with migration
---

# Laravel Model Generator

I'll help you create a new Eloquent model with migration.

## Usage

```bash
# Generate model with migration
php artisan make:model Vehicle -m

# Generate model with migration, factory, and seeder
php artisan make:model Vehicle -mf

# Generate model with all resources
php artisan make:model Vehicle -mf --seed --policy
```

## Example Model Structure

```php
// app/Models/Vehicle.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Vehicle extends Model
{
    protected $fillable = [
        'make',
        'model',
        'year',
        'price',
        'status',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'published_at' => 'datetime',
    ];

    protected $attributes = [
        'status' => 'active',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(VehicleImage::class);
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeByMake($query, string $make)
    {
        return $query->where('make', $make);
    }
}
```

What would you like to create?
1. Tell me the model name
2. Describe the model properties and relationships
3. I'll generate the model code
