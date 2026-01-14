---
name: /laravel-livewire
description: Generate Livewire component
---

# Livewire Component Generator

I'll help you create a Livewire component for dynamic UI.

## Usage

```bash
# Generate Livewire component
php artisan make:livewire VehicleSearch

# Generate component with inline view
php artisan make:livewire vehicle-search --inline

# Generate in subdirectory
php artisan make:livewire Vehicles/VehicleList
```

## Basic Component

```php
// app/Http/Livewire/VehicleSearch.php
namespace App\Http\Livewire;

use Livewire\Component;
use App\Models\Vehicle;

class VehicleSearch extends Component
{
    public $search = '';
    public $make = '';
    public $minPrice = 0;
    public $maxPrice = 100000;

    public function render()
    {
        return view('livewire.vehicle-search', [
            'vehicles' => Vehicle::query()
                ->when($this->search, fn($q) => $q->where('model', 'like', "%{$this->search}%"))
                ->when($this->make, fn($q) => $q->where('make', $this->make))
                ->whereBetween('price', [$this->minPrice, $this->maxPrice])
                ->get(),
        ]);
    }

    public function resetFilters()
    {
        $this->reset(['search', 'make', 'minPrice', 'maxPrice']);
    }
}
```

## Blade View

```blade
<!-- resources/views/livewire/vehicle-search.blade.php -->
<div>
    <div class="flex gap-4 mb-4">
        <input
            wire:model.live="search"
            type="text"
            placeholder="Search vehicles..."
        >

        <select wire:model.live="make">
            <option value="">All Makes</option>
            <option value="Tesla">Tesla</option>
            <option value="Renault">Renault</option>
            <option value="Peugeot">Peugeot</option>
        </select>

        <input wire:model.live="minPrice" type="number" min="0">
        <input wire:model.live="maxPrice" type="number" min="0">

        <button wire:click="resetFilters">Reset</button>
    </div>

    <div class="grid grid-cols-3 gap-4">
        @foreach ($vehicles as $vehicle)
            <div class="border p-4">
                <h3>{{ $vehicle->make }} {{ $vehicle->model }}</h3>
                <p>€{{ number_format($vehicle->price, 2) }}</p>
            </div>
        @endforeach
    </div>
</div>
```

## Using in Blade

```blade
<!DOCTYPE html>
<html>
<head>
    @livewireStyles
</head>
<body>
    <livewire:vehicle-search />

    @livewireScripts
</body>
</html>
```

## Form Component

```php
// app/Http/Livewire/CreateVehicle.php
namespace App\Http\Livewire;

use Livewire\Component;
use App\Models\Vehicle;

class CreateVehicle extends Component
{
    public $make = '';
    public $model = '';
    public $year = 2024;
    public $price = 0;

    protected $rules = [
        'make' => 'required|string|min:2',
        'model' => 'required|string|min:2',
        'year' => 'required|integer|min:1900|max:2025',
        'price' => 'required|numeric|min:0',
    ];

    public function save()
    {
        $this->validate();

        Vehicle::create([
            'make' => $this->make,
            'model' => $this->model,
            'year' => $this->year,
            'price' => $this->price,
        ]);

        session()->flash('message', 'Vehicle created successfully!');
        $this->reset();
    }

    public function render()
    {
        return view('livewire.create-vehicle');
    }
}
```

## Form View

```blade
<div>
    @if (session()->has('message'))
        <div class="alert alert-success">
            {{ session('message') }}
        </div>
    @endif

    <form wire:submit.prevent="save">
        <div>
            <label>Make</label>
            <input type="text" wire:model="make">
            @error('make') <span>{{ $message }}</span> @enderror
        </div>

        <div>
            <label>Model</label>
            <input type="text" wire:model="model">
            @error('model') <span>{{ $message }}</span> @enderror
        </div>

        <div>
            <label>Year</label>
            <input type="number" wire:model="year">
            @error('year') <span>{{ $message }}</span> @enderror
        </div>

        <div>
            <label>Price</label>
            <input type="number" wire:model="price">
            @error('price') <span>{{ $message }}</span> @enderror
        </div>

        <button type="submit" :disabled="$wire->processing">
            {{ $wire->processing ? 'Saving...' : 'Save' }}
        </button>
    </form>
</div>
```

## Loading States

```blade
<div wire:loading wire:target="save">
    Saving...
</div>

<button wire:click="save" wire:loading.attr="disabled">
    <span wire:loading.remove>Save</span>
    <span wire:loading>Saving...</span>
</button>
```

What Livewire component would you like to create?
1. Tell me the component name and purpose
2. Describe what data/properties it needs
3. Describe what actions it should handle
4. I'll generate the component code
