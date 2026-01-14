---
name: /laravel-job
description: Generate queued job
---

# Laravel Job Generator

I'll help you create a queued job for background processing.

## Usage

```bash
# Generate job
php artisan make:job ProcessPayment

# Generate job with queueable
php artisan make:job SendEmail --queued
```

## Basic Job

```php
// app/Jobs/SendWelcomeEmail.php
namespace App\Jobs;

use App\Mail\WelcomeEmail;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;

class SendWelcomeEmail implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $timeout = 30;

    public function __construct(
        public User $user
    ) {}

    public function handle(): void
    {
        Mail::to($this->user)->send(new WelcomeEmail($this->user));
    }

    public function failed(\Throwable $exception): void
    {
        \Log::error('Failed to send welcome email', [
            'user_id' => $this->user->id,
            'error' => $exception->getMessage(),
        ]);
    }
}
```

## Dispatching Jobs

```php
// Dispatch immediately
SendWelcomeEmail::dispatch($user);

// Dispatch with delay
SendWelcomeEmail::dispatch($user)->delay(now()->addMinutes(5));

// Dispatch at specific time
ProcessPayment::dispatch($payment)->delay(now()->addHours(2));

// Chain jobs
Bus::chain([
    new ProcessOrder($order),
    new SendConfirmationEmail($user),
    new UpdateInventory($order),
])->dispatch();

// Batch jobs
Bus::batch([
    new ProcessVideo($video1),
    new ProcessVideo($video2),
])->then(function (Batch $batch) {
    // All completed
})->catch(function (Batch $batch, \Throwable $e) {
    // First failure
})->name('Process Videos')->dispatch();
```

## Job with Unique ID

```php
use Illuminate\Bus\Batch;

class ProcessVideo implements ShouldQueue, ShouldBeUnique
{
    use Queueable, SerializesModels;

    public function __construct(public Video $video) {}

    public function uniqueId(): string
    {
        return $this->video->id;
    }

    public function uniqueFor(): int
    {
        return 3600; // Lock for 1 hour
}

    public function handle(): void
    {
        // Process video
    }
}
```

## Job Middleware

```php
use Illuminate\Support\Facades\RateLimiter;

class ProcessApiRequest implements ShouldQueue
{
    public function middleware(): array
    {
        return [(new RateLimited('api'))->allow(10)];
    }

    public function handle(): void
    {
        // Process request
    }
}
```

## Testing Jobs

```php
use App\Jobs\SendWelcomeEmail;
use App\Models\User;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Mail;

/** @test */
public function it_queues_the_job()
{
    Queue::fake();

    $user = User::factory()->create();
    dispatch(new SendWelcomeEmail($user));

    Queue::assertPushed(SendWelcomeEmail::class);
}

/** @test */
public function it_sends_the_email()
{
    Mail::fake();

    $user = User::factory()->create();
    dispatch_sync(new SendWelcomeEmail($user));

    Mail::assertSent(WelcomeEmail::class);
}
```

What job would you like to create?
1. Tell me the job name and purpose
2. Describe what data it needs
3. I'll generate the job code
