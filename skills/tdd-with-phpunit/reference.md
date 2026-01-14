# Reference

---
name: laravel:tdd-with-phpunit
description: Test-Driven Development workflow with PHPUnit for Laravel applications
---

# TDD with PHPUnit for Laravel

## The RED-GREEN-REFACTOR Cycle

### 1. RED: Write a failing test

```php
// tests/Feature/UserServiceTest.php
namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;

class UserServiceTest extends TestCase
{
    public function it_can_get_a_user_by_id()
    {
        $user = User::factory()->create();

        $response = $this->getJson("/api/users/{$user->id}");

        $response->assertStatus(200)
            ->assertJson([
                'id' => $user->id,
                'name' => $user->name,
            ]);
    }
}
```

### 2. GREEN: Make it pass (minimal implementation)

```php
// routes/api.php
Route::get('/users/{id}', function ($id) {
    return User::findOrFail($id);
});
```

### 3. REFACTOR: Improve the code

```php
// app/Http/Controllers/UserController.php
class UserController extends Controller
{
    public function show($id)
    {
        return new UserResource(User::findOrFail($id));
    }
}
```

## PHPUnit Testing Patterns

### Basic Test Structure

```php
// tests/Feature/CreateOrderTest.php
namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

class CreateOrderTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function it_creates_an_order()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->postJson('/orders', [
                'product_id' => $product->id,
                'quantity' => 2,
            ]);

        $response->assertStatus(201)
            ->assertJsonFragment(['total' => 200]);
    }

    /** @test */
    public function it_requires_authentication()
    {
        $response = $this->postJson('/orders', [
            'product_id' => $product->id,
            'quantity' => 2,
        ]);

        $response->assertStatus(401);
    }
}
```

### Unit Tests

```php
// tests/Unit/PriceCalculatorTest.php
namespace Tests\Unit;

use Tests\TestCase;
use App\Services\PriceCalculator;

class PriceCalculatorTest extends TestCase
{
    /** @test */
    public function it_calculates_price_with_tax()
    {
        $calculator = new PriceCalculator(taxRate: 0.2);

        $price = $calculator->calculate(100);

        $this->assertEquals(120.0, $price);
    }
}
```

### Data Providers

```php
// tests/Unit/ValidatorTest.php
namespace Tests\Unit;

use Tests\TestCase;
use App\Rules\FrenchLicensePlate;

class ValidatorTest extends TestCase
{
    /**
     * @test
     * @dataProvider licensePlateProvider
     */
    public function it_validates_french_license_plates($plate, $valid)
    {
        $rule = new FrenchLicensePlate();

        $this->assertEquals($valid, $rule->passes('plate', $plate));
    }

    public function licensePlateProvider()
    {
        return [
            ['AA-123-BB', true],
            ['AB-123-CD', true],
            ['123-456-789', false],
            ['AB-123', false],
        ];
    }
}
```

### Testing JSON APIs

```php
// tests/Feature/Api/VehicleIndexTest.php
namespace Tests\Feature\Api;

use Tests\TestCase;
use App\Models\Vehicle;

class VehicleIndexTest extends TestCase
{
    /** @test */
    public function it_paginates_vehicles()
    {
        Vehicle::factory()->count(25)->create();

        $response = $this->getJson('/api/vehicles');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'make', 'model', 'price']
                ],
                'links',
                'meta',
            ]);
    }

    /** @test */
    public function it_filters_vehicles_by_make()
    {
        Vehicle::factory()->create(['make' => 'Renault']);
        Vehicle::factory()->create(['make' => 'Peugeot']);

        $response = $this->getJson('/api/vehicles?make=Renault');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.make', 'Renault');
    }
}
```

### Testing Database Relationships

```php
// tests/Feature/UserModelTest.php
namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Post;
use Illuminate\Foundation\Testing\RefreshDatabase;

class UserModelTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function a_user_has_many_posts()
    {
        $user = User::factory()
            ->has(Post::factory()->count(3))
            ->create();

        $this->assertCount(3, $user->posts);
    }
}
```

### Testing Jobs

```php
// tests/Unit/Jobs/SendWelcomeEmailJobTest.php
namespace Tests\Unit\Jobs;

use Tests\TestCase;
use App\Jobs\SendWelcomeEmailJob;
use App\Models\User;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Mail;

class SendWelcomeEmailJobTest extends TestCase
{
    /** @test */
    public function it_queues_the_job()
    {
        Queue::fake();

        $user = User::factory()->create();
        dispatch(new SendWelcomeEmailJob($user));

        Queue::assertPushed(SendWelcomeEmailJob::class);
    }

    /** @test */
    public function it_sends_the_email()
    {
        Mail::fake();

        $user = User::factory()->create();
        dispatch_sync(new SendWelcomeEmailJob($user));

        Mail::assertSent(WelcomeEmail::class);
    }
}
```

### Testing Events and Listeners

```php
// tests/Unit/Listeners/SendNotificationListenerTest.php
namespace Tests\Unit\Listeners;

use Tests\TestCase;
use App\Events\OrderCreated;
use App\Listeners\SendNotificationListener;
use Illuminate\Support\Facades\Event;

class SendNotificationListenerTest extends TestCase
{
    /** @test */
    public function it_listens_to_order_created_event()
    {
        Event::fake();

        Event::assertListening(
            OrderCreated::class,
            SendNotificationListener::class
        );
    }
}
```

### Testing Middleware

```php
// tests/Feature/CheckAgeMiddlewareTest.php
namespace Tests\Feature;

use Tests\TestCase;

class CheckAgeMiddlewareTest extends TestCase
{
    /** @test */
    public function it_blocks_users_under_18()
    {
        $response = $this->get('/register?age=17');

        $response->assertStatus(302)
            ->assertRedirect('/');
    }

    /** @test */
    public function it_allows_users_18_or_older()
    {
        $response = $this->get('/register?age=18');

        $response->assertStatus(200);
    }
}
```

### Testing Authentication

```php
// tests/Feature/AuthenticationTest.php
namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AuthenticationTest extends TestCase
{
    /** @test */
    public function a_user_can_login_with_correct_credentials()
    {
        $user = User::factory()->create([
            'password' => Hash::make('password123'),
        ]);

        $response = $this->post('/login', [
            'email' => $user->email,
            'password' => 'password123',
        ]);

        $this->assertAuthenticatedAs($user);
    }

    /** @test */
    public function a_user_cannot_login_with_incorrect_password()
    {
        $user = User::factory()->create([
            'password' => Hash::make('password123'),
        ]);

        $response = $this->post('/login', [
            'email' => $user->email,
            'password' => 'wrong-password',
        ]);

        $this->assertGuest();
    }
}

## Best Practices

1. **Use `@test` annotation**: Makes test methods clear
2. **Name tests descriptively**: `it_creates_an_order` instead of `test_it_works`
3. **One assertion per test**: Keep tests focused
4. **Use factories**: Don't create data manually
5. **Test behavior, not implementation**: Focus on what, not how
6. **Arrange-Act-Assert**: Structure tests clearly
7. **Mock external services**: Don't hit real APIs in tests

## Running Tests

```bash
# Run all tests
php artisan test

# Run specific test class
php artisan test --testsuite=Feature
php artisan test --filter UserServiceTest

# Run specific test method
php artisan test --filter test_it_creates_an_order

# Run with coverage
php artisan test --coverage

# Stop on first failure
php artisan test --stop-on-failure

# Verbose output
php artisan test --verbose
```
