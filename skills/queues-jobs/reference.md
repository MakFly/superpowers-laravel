# Reference

---
name: laravel:queues-jobs
description: Background processing with Queues and Jobs
---

# Laravel Queues & Jobs

## Creating Jobs

```bash
# Create job
php artisan make:job ProcessPayment

# Create job with queueable
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

    public function __construct(
        public User $user
    ) {}

    public function handle(): void
    {
        Mail::to($this->user)->send(new WelcomeEmail($this->user));
    }
}

// Dispatch
dispatch(new SendWelcomeEmail($user));
// Or
SendWelcomeEmail::dispatch($user);
```

## Job with Retries

```php
class ProcessPayment implements ShouldQueue
{
    public $tries = 3; // Max attempts
    public $timeout = 30; // 30 seconds max

    public function __construct(
        public string $paymentId
    ) {}

    public function handle(): void
    {
        // Process payment
    }

    public function failed(\Throwable $exception): void
    {
        // Called after all retries exhausted
        \Log::error('Payment failed', [
            'payment_id' => $this->paymentId,
            'error' => $exception->getMessage(),
        ]);
    }
}
```

## Delayed Jobs

```php
// Dispatch in 5 minutes
SendWelcomeEmail::dispatch($user)->delay(now()->addMinutes(5));

// Dispatch at specific time
ProcessPayment::dispatch($paymentId)
    ->delay(now()->addHours(2));

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
    new ProcessVideo($video3),
])->then(function (Batch $batch) {
    // All jobs completed successfully
})->catch(function (Batch $batch, \Throwable $e) {
    // First batch failure detected
})->finally(function (Batch $batch) {
    // All jobs finished
})->name('Process Videos')->dispatch();
```

## Job Middleware

```php
// app/Jobs/ProcessPayment.php
use Illuminate\Support\Facades\RateLimiter;

public function middleware(): array
{
    return [(new RateLimited('payment'))->allow(10)];
}

// Register rate limiter
// app/Providers/AppServiceProvider.php
use Illuminate\Support\Facades\RateLimiter;

public function boot(): void
{
    RateLimiter::for('payment', function (Job $job) {
        return $job->user->id;
    });
}
```

## Unique Jobs

```php
use Illuminate\Bus\Batch;

class ProcessVideo implements ShouldQueue
{
    use Dispatchable, Queueable, SerializesModels;

    public $uniqueId = 'video';

    public function __construct(
        public Video $video
    ) {
        $this->uniqueId = $this->video->id;
    }

    public function uniqueFor(): int
    {
        return 3600; // Lock for 1 hour
    }
}

// Or with ShouldBeUnique
class ProcessVideo implements ShouldQueue, ShouldBeUnique
{
    use Queueable, SerializesModels;

    public function __construct(public Video $video) {}

    public function uniqueId(): string
    {
        return $this->video->id;
    }
}
```

## Queue Configuration

```php
// config/queue.php
'connections' => [
    'database' => [
        'driver' => 'database',
        'table' => 'jobs',
        'queue' => 'default',
        'retry_after' => 90,
        'after_commit' => true,
    ],
    'redis' => [
        'driver' => 'redis',
        'connection' => 'default',
        'queue' => 'default',
        'retry_after' => 90,
        'block_for' => null,
        'after_commit' => true,
    ],
],
```

## Dispatching to Specific Queue

```php
// Dispatch to specific queue
ProcessVideo::dispatch($video)->onQueue('processing');

// Dispatch to specific connection
ProcessPayment::dispatch($payment)->onConnection('redis');

// Chain with different queues
Bus::chain([
    new ProcessOrder($order),
    (new SendEmail($user))->onQueue('emails'),
])->dispatch();
```

## Running Workers

```bash
# Start queue worker
php artisan queue:work

# Work specific queue
php artisan queue:work --queue=emails,payments

# Work with daemon
php artisan queue:work --daemon

# Work with timeout
php artisan queue:work --timeout=60

# Work with sleep
php artisan queue:work --sleep=3

# Work with tries
php artisan queue:work --tries=3

# Work one job only
php artisan queue:work --once

# Stop when queue is empty
php artisan queue:work --stop-when-empty

# Work in background
php artisan queue:work &

# Using supervisor (recommended for production)
// /etc/supervisor/conf.d/laravel-worker.conf
[program:laravel-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/app/artisan queue:work --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=4
redirect_stderr=true
stdout_logfile=/var/www/app/storage/logs/worker.log
stopwaitsecs=3600
```

## Database Queue Setup

```bash
# Create jobs table
php artisan queue:failed-table
php artisan queue:table

# Run migration
php artisan migrate
```

## Failed Jobs

```bash
# List failed jobs
php artisan queue:failed

# Retry failed job by ID
php artisan queue:retry 1

# Retry all failed jobs
php artisan queue:retry all

# Clear failed jobs
php artisan queue:flush

# Delete failed job by ID
php artisan queue:forget 1
```

## Job Batching

```php
use Illuminate\Bus\Batch;
use Illuminate\Support\Facades\Bus;

$batch = Bus::batch([
    new ImportCsv('file1.csv'),
    new ImportCsv('file2.csv'),
    new ImportCsv('file3.csv'),
])->then(function (Batch $batch) {
    // All jobs completed successfully
    Log::info('Batch completed', ['batch_id' => $batch->id]);
})->catch(function (Batch $batch, \Throwable $e) {
    // First batch failure detected
    Log::error('Batch failed', ['batch_id' => $batch->id]);
})->finally(function (Batch $batch) {
    // All jobs finished (success or failure)
    Log::info('Batch finished', ['batch_id' => $batch->id]);
})->onConnection('redis')->onQueue('imports')->dispatch();

// Check batch status
$batch = Bus::findBatch($batchId);
if ($batch->finished()) {
    // Do something
}
```

## Job Events

```php
// app/Providers/EventServiceProvider.php
use Illuminate\Queue\Events\JobProcessed;
use Illuminate\Queue\Events\JobProcessing;
use Illuminate\Queue\Events\JobFailed;

public function boot(): void
{
    // Before job processing
    Queue::before(function (JobProcessing $event) {
        Log::info('Job starting', ['job' => $event->job->resolveName()]);
    });

    // After job processed
    Queue::after(function (JobProcessed $event) {
        Log::info('Job finished', ['job' => $event->job->resolveName()]);
    });

    // Job failed
    Queue::failing(function (JobFailed $event) {
        Log::error('Job failed', [
            'job' => $event->job->resolveName(),
            'exception' => $event->exception->getMessage(),
        ]);
    });

    // Job retrying
    Queue::looping(function () {
        while (DB::transactionLevel() > 0) {
            DB::rollBack();
        }
    });
}
```

## Queued Events

```php
// Event listeners should implement ShouldQueue
// app/Listeners/SendNotification.php
namespace App\Listeners;

use App\Events\OrderCreated;
use Illuminate\Contracts\Queue\ShouldQueue;

class SendNotification implements ShouldQueue
{
    public function handle(OrderCreated $event): void
    {
        // Send notification
    }
}
```

## Best Practices

1. **Make jobs idempotent**: Handle duplicate runs
2. **Use unique jobs**: Prevent duplicate work
3. **Set timeouts**: Prevent hanging jobs
4. **Retry wisely**: Set appropriate retry limits
5. **Monitor queues**: Use Horizon or custom monitoring
6. **Use batches**: For related work
7. **Handle failures**: Log and notify appropriately
8. **Use separate queues**: For different priorities
9. **Use supervisor**: Keep workers running
10. **Test jobs**: Write tests for job logic

## Common Patterns

### Throttling

```php
use Illuminate\Support\Facades\RateLimiter;

class ProcessApiRequest implements ShouldQueue
{
    public $tries = 3;
    public $maxExceptions = 3;

    public function handle(): void
    {
        RateLimiter::attempt('api', 10, function () {
            // API call here
        }, 60); // 10 attempts per 60 seconds
    }
}
```

### Job Chaining

```php
class OrderWorkflow
{
    public static function execute(Order $order)
    {
        Bus::chain([
            new ValidateOrder($order),
            new ProcessPayment($order),
            new UpdateInventory($order),
            new SendConfirmationEmail($order),
            new UpdateAnalytics($order),
       ])->catch(function (\Throwable $e) use ($order) {
            // Handle failure
            Log::error('Order workflow failed', [
                'order_id' => $order->id,
                'error' => $e->getMessage(),
            ]);
        })->dispatch();
    }
}
```

### Dispatchable Trait

```php
// Add to model for easy dispatching
// app/Models/Video.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Bus\Dispatchable;

class Video extends Model
{
    use Dispatchable;

    public function process()
    {
        return ProcessVideo::dispatch($this);
    }
}

// Usage
$video->process();
```
