# Reference

---
name: laravel:inertia
description: SPA-like experience with Inertia.js
---

# Inertia.js - SPA Without API

## Installation

```bash
# Install server-side (Laravel)
composer require inertiajs/inertia-laravel

# Install client-side (Vue/React/Svelte)
npm install @inertiajs/vue3
# Or
npm install @inertiajs/react
# Or
npm install @inertiajs/svelte

# Install middleware
php artisan inertia:middleware

# Publish config (optional)
php artisan vendor:publish --provider="Inertia\ServiceProvider"
```

## Basic Setup

```php
// routes/web.php
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Home', [
        'user' => auth()->user(),
    ]);
});

Route::inertia('/about', 'About');

// Named routes
Route::get('/vehicles/{vehicle}', function (Vehicle $vehicle) {
    return Inertia::render('Vehicles/Show', [
        'vehicle' => $vehicle,
    ]);
})->name('vehicles.show');
```

## Vue Component

```vue
<!-- resources/js/Pages/Vehicles/Show.vue -->
<script setup>
import { Link } from '@inertiajs/vue3'
import Layout from '@/Layouts/AppLayout.vue'

defineProps({
    vehicle: {
        type: Object,
        required: true
    }
})

defineOptions({
    layout: Layout
})
</script>

<template>
    <div>
        <h1>{{ vehicle.make }} {{ vehicle.model }}</h1>
        <p>Price: €{{ vehicle.price }}</p>

        <Link :href="`/vehicles/${vehicle.id}/edit`">Edit</Link>
        <Link href="/vehicles">Back to list</Link>
    </div>
</template>
```

## Shared Data

```php
// app/Http/Middleware/HandleInertiaRequests.php
public function share(Request $request): array
{
    return array_merge(parent::share($request), [
        'auth' => [
            'user' => $request->user(),
        ],
        'flash' => [
            'success' => fn () => $request->session()->get('success'),
            'error' => fn () => $request->session()->get('error'),
        ],
        'errors' => fn () => $request->session()->get('errors')
            ? $request->session()->get('errors')
            : (object) [],
    ]);
}
```

## Links

```vue
<script setup>
import { Link } from '@inertiajs/vue3'
</script>

<template>
    <!-- Basic link -->
    <Link href="/vehicles">Vehicles</Link>

    <!-- Named route -->
    <Link :href="route('vehicles.show', vehicle.id)">View</Link>

    <!-- Method (POST, PUT, DELETE) -->
    <Link href="/vehicles" method="post">Create</Link>
    <Link :href="`/vehicles/${vehicle.id}`" method="put">Update</Link>
    <Link :href="`/vehicles/${vehicle.id}`" method="delete">Delete</Link>

    <!-- With data -->
    <Link href="/search" :data="{ query: 'Tesla' }">Search</Link>

    <!-- Headers -->
    <Link href="/vehicles" :headers="{ 'X-Custom': 'value' }">Vehicles</Link>

    <!-- Preserve state (scroll position) -->
    <Link href="/vehicles" preserve-state>View</Link>

    <!-- Preserve scroll (for other pages) -->
    <Link href="/vehicles" preserve-scroll>Load more</Link>

    <!-- Replace (don't add to history) -->
    <Link href="/vehicles" replace>Vehicles</Link>

    <!-- Active state -->
    <Link href="/vehicles" class="active">Vehicles</Link>
</template>
```

## Forms

```vue
<script setup>
import { useForm } from '@inertiajs/vue3'

const form = useForm({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    price: 0,
})

const submit = () => {
    form.post('/vehicles', {
        onSuccess: () => form.reset(),
        onError: () => {
            // Handle errors
        }
    })
}
</script>

<template>
    <form @submit.prevent="submit">
        <input v-model="form.make" type="text" />
        <div v-if="form.errors.make">{{ form.errors.make }}</div>

        <input v-model="form.model" type="text" />
        <div v-if="form.errors.model">{{ form.errors.model }}</div>

        <input v-model.number="form.year" type="number" />
        <input v-model.number="form.price" type="number" />

        <button type="submit" :disabled="form.processing">
            {{ form.processing ? 'Saving...' : 'Save' }}
        </button>
    </form>
</template>
```

## Visiting Pages Programmatically

```vue
<script setup>
import { router } from '@inertiajs/vue3'

const visit = () => {
    router.visit('/vehicles')
}

const visitWithOptions = () => {
    router.visit('/vehicles', {
        method: 'get',
        data: { search: 'Tesla' },
        replace: false,
        preserveState: true,
        preserveScroll: true,
        only: ['vehicles'], // Only reload specific props
        headers: {
            'X-Custom': 'value'
        },
        onCancelToken: (cancelToken) => {
            // Store for cancellation
        },
        onCancel: () => {
            console.log('Request was cancelled')
        },
        onStart: () => {
            console.log('Request started')
        },
        onProgress: (progress) => {
            console.log('Progress:', progress)
        },
        onSuccess: (page) => {
            console.log('Success:', page)
        },
        onError: (errors) => {
            console.log('Errors:', errors)
        },
        onFinish: () => {
            console.log('Finished')
        }
    })
}

// HTTP methods
router.get('/vehicles')
router.post('/vehicles', data)
router.put('/vehicles/1', data)
router.patch('/vehicles/1', data)
router.delete('/vehicles/1')

// Reload current page
router.reload()

// Reload only specific props
router.reload({ only: ['vehicles'] })
</script>
```

## Flash Messages

```php
// Controller
public function store(Request $request)
{
    $vehicle = Vehicle::create($request->validated());

    return redirect()->route('vehicles.show', $vehicle)
        ->with('success', 'Vehicle created successfully!');
}
```

```vue
<!-- Show flash message -->
<script setup>
import { usePage } from '@inertiajs/vue3'
import { watch } from 'vue'

const page = usePage()

watch(() => page.props.flash, (flash) => {
    if (flash.success) {
        alert(flash.success)
    }
    if (flash.error) {
        alert(flash.error)
    }
}, { immediate: true })
</script>

<template>
    <div v-if="$page.props.flash.success" class="alert alert-success">
        {{ $page.props.flash.success }}
    </div>
</template>
```

## Validation Errors

```vue
<script setup>
import { useForm } from '@inertiajs/vue3'

const form = useForm({
    email: '',
    password: '',
})

const login = () => {
    form.post('/login', {
        onError: (errors) => {
            // Errors are automatically populated in form.errors
            console.log(errors)
        }
    })
}
</script>

<template>
    <form @submit.prevent="login">
        <input v-model="form.email" type="email" />
        <div v-if="form.errors.email" class="error">
            {{ form.errors.email }}
        </div>
    </form>

    <!-- Or access from page props -->
    <div v-if="$page.props.errors.email" class="error">
        {{ $page.props.errors.email }}
    </div>
</template>
```

## Lazy Loading

```vue
<script setup>
import { defineAsyncComponent } from 'vue'

const HeavyComponent = defineAsyncComponent(() =>
    import('@/Components/HeavyComponent.vue')
)
</script>

<template>
    <Suspense>
        <HeavyComponent />
        <template #fallback>
            <p>Loading...</p>
        </template>
    </Suspense>
</template>
```

## Modals

```vue
<script setup>
import { ref } from 'vue'
import { useForm } from '@inertiajs/vue3'

const show = ref(false)

const form = useForm({
    name: '',
})

const open = () => {
    show.value = true
}

const close = () => {
    show.value = false
    form.reset()
}

const submit = () => {
    form.post('/vehicles', {
        onSuccess: close
    })
}
</script>

<template>
    <button @click="open">Create Vehicle</button>

    <div v-if="show" class="modal">
        <form @submit.prevent="submit">
            <input v-model="form.name" />
            <button type="submit">Save</button>
            <button type="button" @click="close">Cancel</button>
        </form>
    </div>
</template>
```

## Remembering State

```vue
<script setup>
import { useForm } from '@inertiajs/vue3'

const form = useForm({
    filters: '',
})

// Form state is automatically preserved
// when using preserveState: true
</script>

<template>
    <Link href="/results" preserve-state>
        Search (keeps form state)
    </Link>
</template>
```

## Server-Side Rendering (SSR)

```bash
# Install SSR dependencies
npm install @inertiajs/vue3 @vue/server-renderer

# Build SSR
npm run build

# Start SSR server
node bootstrap/ssr/ssr.js
```

```php
// config/inertia.php
'ssr' => [
    'enabled' => env('INERTIA_SSR', true),
    'url' => env('INERTIA_SSR_URL', 'http://127.0.0.1:13714/render'),
],
```

## Best Practices

1. **Use layouts**: Create consistent page layouts
2. **Share common data**: Use HandleInertiaRequests middleware
3. **Use forms**: Leverage useForm for easy form handling
4. **Lazy load**: Load heavy components on demand
5. **Optimize props**: Only pass what's needed
6. **Handle errors**: Display validation errors clearly
7. **Use Links**: Use Link component for navigation
8. **Progressive enhancement**: Works without JS
9. **Test thoroughly**: Test client and server
10. **Security**: Validate on server, validate on client

## Common Patterns

### Data Table with Pagination

```vue
<script setup>
import { router } from '@inertiajs/vue3'

defineProps({
    vehicles: Object,
    filters: Object
})

const search = (value) => {
    router.get('/vehicles', { search: value }, {
        preserveState: true,
        replace: true
    })
}
</script>

<template>
    <input
        :value="filters.search"
        @input="search($event.target.value)"
        placeholder="Search..."
    />

    <table>
        <tr v-for="vehicle in vehicles.data" :key="vehicle.id">
            <td>{{ vehicle.make }}</td>
            <td>{{ vehicle.model }}</td>
        </tr>
    </table>

    <!-- Pagination links -->
    <Link
        v-for="link in vehicles.links"
        :href="link.url"
        v-html="link.label"
    />
</template>
```

### Confirm Before Navigation

```vue
<script setup>
import { router } from '@inertiajs/vue3'

router.on('before', (event) => {
    if (!confirm('Are you sure you want to leave?')) {
        event.preventDefault()
    }
})
</script>
```

### Partial Reloads

```vue
<script setup>
import { router } from '@inertiajs/vue3'

const refreshVehicles = () => {
    router.reload({ only: ['vehicles'] })
}
</script>
```

### Back Button Handling

```vue
<script setup>
import { router } from '@inertiajs/vue3'

const goBack = () => {
    router.visit(window.history.back())
}
</script>

<button @click="goBack">Back</button>
```
