# Reference

---
name: laravel:livewire
description: Full-stack reactive components with Livewire
---

# Livewire - Full-Stack Reactive Components

## Installation

```bash
# Install Livewire
composer require livewire/livewire

# Publish config (optional)
php artisan livewire:publish --config
```

## Creating Components

```bash
# Create component
php artisan make:livewire VehicleSearch

# Create component with view
php artisan make:livewire VehicleForm

# Create component in subdirectory
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
}
```

```blade
<!-- resources/views/livewire/vehicle-search.blade.php -->
<div>
    <input wire:model.live="search" type="text" placeholder="Search vehicles...">
    <select wire:model.live="make">
        <option value="">All Makes</option>
        <option value="Tesla">Tesla</option>
        <option value="Renault">Renault</option>
    </select>

    <input wire:model.live="minPrice" type="number" min="0">
    <input wire:model.live="maxPrice" type="number" min="0">

    <ul>
        @foreach ($vehicles as $vehicle)
            <li>{{ $vehicle->make }} {{ $vehicle->model }} - €{{ $vehicle->price }}</li>
        @endforeach
    </ul>
</div>
```

```blade
<!-- resources/views/welcome.blade.php -->
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

## Properties

```php
class VehicleForm extends Component
{
    // Public properties (automatically synced to frontend)
    public $make = '';
    public $model = '';
    public $year = 2024;
    public $price = 0;

    // Protected properties (not synced)
    protected $rules = [];

    // Private properties (not synced)
    private $internalState = [];

    // Computed properties
    public function getFullModelNameProperty()
    {
        return "{$this->make} {$this->model}";
    }
}
```

## Validation

```php
class VehicleForm extends Component
{
    public $make = '';
    public $model = '';
    public $price = '';

    protected $rules = [
        'make' => 'required|string|min:2',
        'model' => 'required|string|min:2',
        'price' => 'required|numeric|min:0',
    ];

    protected $messages = [
        'make.required' => 'The make is required.',
        'price.min' => 'Price must be positive.',
    ];

    public function save()
    {
        $this->validate();

        Vehicle::create([
            'make' => $this->make,
            'model' => $this->model,
            'price' => $this->price,
        ]);

        session()->flash('message', 'Vehicle created!');
    }
}
```

```blade
<div>
    <form wire:submit.prevent="save">
        <input type="text" wire:model="make">
        @error('make') <span>{{ $message }}</span> @enderror

        <input type="text" wire:model="model">
        @error('model') <span>{{ $message }}</span> @enderror

        <input type="number" wire:model="price">
        @error('price') <span>{{ $message }}</span> @enderror

        <button type="submit">Save</button>
    </form>

    @if (session()->has('message'))
        <div>{{ session('message') }}</div>
    @endif
</div>
```

## Actions

```php
class VehicleList extends Component
{
    public $vehicles;
    public $selectedVehicle = null;

    public function mount()
    {
        $this->vehicles = Vehicle::all();
    }

    public function selectVehicle($vehicleId)
    {
        $this->selectedVehicle = Vehicle::find($vehicleId);
    }

    public function deleteVehicle($vehicleId)
    {
        Vehicle::find($vehicleId)->delete();
        $this->vehicles = Vehicle::all();
    }

    public function refresh()
    {
        $this->vehicles = Vehicle::all();
    }
}
```

## Events

### Dispatching Events

```php
// Dispatch to component
$this->dispatch('vehicle-selected', vehicleId: $vehicle->id);

// Dispatch to browser (JavaScript)
$this->dispatch('close-modal');

// Dispatch to other components
$this->dispatch('refresh-vehicles')->to(VehicleList::class);
```

### Listening to Events

```php
class VehicleList extends Component
{
    protected $listeners = ['refreshVehicles' => 'refresh'];

    public function refresh()
    {
        $this->vehicles = Vehicle::all();
    }
}

// Or dynamically
public function getListeners()
{
    return [
        "echo:vehicles.{$this->vehicleId},VehicleUpdated" => 'refresh',
    ];
}
```

## Computed Properties

```php
class VehicleCalculator extends Component
{
    public $price = 0;
    public $tax = 0.2;

    public function getTaxAmountProperty()
    {
        return $this->price * $this->tax;
    }

    public function getTotalProperty()
    {
        return $this->price + $this->taxAmount;
    }
}
```

```blade
<div>
    <input wire:model.live="price" type="number">

    <p>Tax: {{ $this->taxAmount }}</p>
    <p>Total: {{ $this->total }}</p>
</div>
```

## Lifecycle Hooks

```php
class VehicleForm extends Component
{
    public $vehicle;

    // When component is mounted
    public function mount($vehicle = null)
    {
        $this->vehicle = $vehicle ?? new Vehicle();
    }

    // Before any update
    public function updating($name, $value)
    {
        // Called before property update
    }

    // After specific property update
    public function updatedMake($value)
    {
        // Called after make is updated
    }

    // After any update
    public function updated($name)
    {
        // Called after any property update
    }

    // Before rendering
    public function hydrate()
    {
        // Called when component is rehydrated from request
    }

    // After rendering
    public function dehydrate()
    {
        // Called before component is dehydrated for response
    }
}
```

## Lazy Loading

```php
class HeavyComponent extends Component
{
    public $data = null;

    public function loadData()
    {
        $this->data = HeavyModel::all();
    }
}
```

```blade
<div>
    @if ($data === null)
        <button wire:click="loadData">Load Data</button>
    @else
        <!-- Display data -->
    @endif
</div>
```

## Wire:directives

```blade
<!-- Wire model (live updates) -->
<input wire:model.live="search">

<!-- Wire model (blur updates) -->
<input wire:model.blur="email">

<!-- Wire model (debounced) -->
<input wire:model.debounce.300ms="search">

<!-- Wire click -->
<button wire:click="save">Save</button>

<!-- Wire submit -->
<form wire:submit.prevent="save">

<!-- Wire key -->
<input wire:model="search" wire:keydown.enter="search">

<!-- Wire loading -->
<div wire:loading wire:target="save">
    Saving...
</div>

<!-- Wire init -->
<div wire:init="loadData">

<!-- Wire poll (every 2 seconds) -->
<div wire:poll.2s>{{ $updatedAt }}</div>

<!-- Wire navigate (SPA-like) -->
<a wire:navigate href="/other-page">Other Page</a>
```

## File Uploads

```php
class VehiclePhotoUpload extends Component
{
    public $photo;

    protected $rules = [
        'photo' => 'required|image|max:1024', // 1MB max
    ];

    public function save()
    {
        $this->validate();

        $path = $this->photo->store('photos');

        VehiclePhoto::create(['path' => $path]);
    }

    public function updatedPhoto()
    {
        $this->validateOnly('photo');
    }
}
```

```blade
<div>
    <form wire:submit.prevent="save">
        <input type="file" wire:model="photo">

        @if ($photo)
            <img src="{{ $photo->temporaryUrl() }}">
        @endif

        <button type="submit">Upload</button>
    </form>
</div>
```

## Pagination

```php
class VehicleList extends Component
{
    public function render()
    {
        return view('livewire.vehicle-list', [
            'vehicles' => Vehicle::paginate(10),
        ]);
    }
}
```

```blade
<div>
    @foreach ($vehicles as $vehicle)
        <div>{{ $vehicle->make }} {{ $vehicle->model }}</div>
    @endforeach

    {{ $vehicles->links() }}
</div>
```

## Nested Components

```php
// Parent component
class VehicleList extends Component
{
    public $vehicles;

    public function render()
    {
        return view('livewire.vehicle-list', [
            'vehicles' => Vehicle::all(),
        ]);
    }
}
```

```blade
<!-- resources/views/livewire/vehicle-list.blade.php -->
<div>
    @foreach ($vehicles as $vehicle)
        <livewire:vehicle-card :vehicle="$vehicle" :key="$vehicle->id" />
    @endforeach
</div>
```

```php
// Child component
class VehicleCard extends Component
{
    public $vehicle;

    public function delete()
    {
        $this->vehicle->delete();
        $this->emitUp('vehicleDeleted');
    }
}
```

## Best Practices

1. **Keep components small**: Single responsibility
2. **Use lazy loading**: Load data on demand
3. **Validate input**: Always validate properties
4. **Use computed properties**: For derived data
5. **Minimize network requests**: Use wire:model.live carefully
6. **Organize components**: Group related functionality
7. **Test components**: Write tests for Livewire components
8. **Use events**: For component communication
9. **Optimize queries**: Use eager loading
10. **Keep state minimal**: Only store what's necessary

## Common Patterns

### Search with Debounce

```blade
<input wire:model.debounce.500ms="search" placeholder="Search...">
```

### Confirmation Before Action

```php
public function deleteVehicle($id)
{
    Vehicle::find($id)->delete();
    session()->flash('message', 'Vehicle deleted!');
}
```

```blade
<button wire:click="deleteVehicle({{ $vehicle->id }})"
        wire:confirm="Are you sure you want to delete this vehicle?">
    Delete
</button>
```

### Loading States

```blade
<button wire:click="save" wire:loading.attr="disabled">
    <span wire:loading.remove>Save</span>
    <span wire:loading>Saving...</span>
</button>
```

### Alpine.js Integration

```blade
<div x-data="{ open: false }">
    <button @click="open = true">Open Modal</button>

    <div x-show="open" style="display: none;">
        <livewire:vehicle-form />

        <button @click="open = false">Close</button>
    </div>
</div>
```
