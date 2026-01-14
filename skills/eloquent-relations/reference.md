# Reference

---
name: laravel:eloquent-relations
description: Eloquent relationships (hasOne, hasMany, belongsTo, belongsToMany, polymorphic, etc.)
---

# Eloquent Relationships

## One-To-One

```php
// app/Models/User.php
class User extends Model
{
    public function profile()
    {
        return $this->hasOne(Profile::class);
    }
}

// app/Models/Profile.php
class Profile extends Model
{
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

// Usage
$user = User::with('profile')->find(1);
$profile = $user->profile;

// Or inverse
$profile = Profile::find(1);
$user = $profile->user;
```

## One-To-Many

```php
// app/Models/Post.php
class Post extends Model
{
    public function comments()
    {
        return $this->hasMany(Comment::class);
    }
}

// app/Models/Comment.php
class Comment extends Model
{
    public function post()
    {
        return $this->belongsTo(Post::class);
    }
}

// Usage
$post = Post::with('comments')->find(1);
$comments = $post->comments()->latest()->get(); // Query builder

// With default
public function user()
{
    return $this->belongsTo(User::class)->withDefault([
        'name' => 'Guest Author'
    ]);
}
```

## Many-To-Many

```php
// app/Models/User.php
class User extends Model
{
    public function roles()
    {
        return $this->belongsToMany(Role::class);
    }
}

// app/Models/Role.php
class Role extends Model
{
    public function users()
    {
        return $this->belongsToMany(User::class);
    }
}

// Usage
$user = User::with('roles')->find(1);
$roles = $user->roles;

// Attach/Detach/Sync
$user->roles()->attach($roleId);
$user->roles()->detach($roleId);
$user->roles()->sync([$roleId1, $roleId2]);

// With pivot data
$user->roles()->attach($roleId, ['expires' => now()->addDays(30)]);

// Access pivot
foreach ($user->roles as $role) {
    echo $role->pivot->expires;
}
```

## Has Many Through

```php
// app/Models/Mechanic.php
class Mechanic extends Model
{
    public function cars()
    {
        return $this->hasManyThrough(Car::class, Owner::class);
    }
}

// Usage: Mechanic -> Owner -> Car
$mechanic = Mechanic::find(1);
$cars = $mechanic->cars;
```

## One-To-One (Polymorphic)

```php
// app/Models/Post.php
class Post extends Model
{
    public function image()
    {
        return $this->morphOne(Image::class, 'imageable');
    }
}

// app/Models/User.php
class User extends Model
{
    public function image()
    {
        return $this->morphOne(Image::class, 'imageable');
    }
}

// app/Models/Image.php
class Image extends Model
{
    public function imageable()
    {
        return $this->morphTo();
    }
}

// Migration
Schema::create('images', function (Blueprint $table) {
    $table->id();
    $table->string('url');
    $table->unsignedBigInteger('imageable_id');
    $table->string('imageable_type');
    $table->timestamps();
});

// Usage
$post = Post::find(1);
$image = $post->image;

// Or inverse
$image = Image::find(1);
$imageable = $image->imageable; // Returns Post or User
```

## One-To-Many (Polymorphic)

```php
// app/Models/Post.php
class Post extends Model
{
    public function comments()
    {
        return $this->morphMany(Comment::class, 'commentable');
    }
}

// app/Models/Video.php
class Video extends Model
{
    public function comments()
    {
        return $this->morphMany(Comment::class, 'commentable');
    }
}

// app/Models/Comment.php
class Comment extends Model
{
    public function commentable()
    {
        return $this->morphTo();
    }
}

// Usage
$post = Post::find(1);
$comments = $post->comments;

// Or inverse
$comment = Comment::find(1);
$commentable = $comment->commentable; // Returns Post or Video
```

## Many-To-Many (Polymorphic)

```php
// app/Models/Post.php
class Post extends Model
{
    public function tags()
    {
        return $this->morphToMany(Tag::class, 'taggable');
    }
}

// app/Models/Video.php
class Video extends Model
{
    public function tags()
    {
        return $this->morphToMany(Tag::class, 'taggable');
    }
}

// app/Models/Tag.php
class Tag extends Model
{
    public function posts()
    {
        return $this->morphedByMany(Post::class, 'taggable');
    }

    public function videos()
    {
        return $this->morphedByMany(Video::class, 'taggable');
    }
}

// Migration
Schema::create('taggables', function (Blueprint $table) {
    $table->id();
    $table->foreignId('tag_id')->constrained();
    $table->unsignedBigInteger('taggable_id');
    $table->string('taggable_type');
    $table->timestamps();
});

// Usage
$post = Post::find(1);
$post->tags()->attach($tagId);
```

## Querying Relations

```php
// Has relationship
$users = User::has('posts')->get();

// Has with count
$users = User::has('posts', '>=', 3)->get();

// Where has
$users = User::whereHas('posts', function ($query) {
    $query->where('published', true);
})->get();

// With default counts
$users = User::withCount('posts')->get();
foreach ($users as $user) {
    echo $user->posts_count;
}

// Eager loading
$posts = Post::with(['author', 'comments'])->get();

// Lazy eager loading
$posts = Post::all();
$posts->load('comments');

// Eager loading with constraint
$users = User::with(['posts' => function ($query) {
    $query->where('published', true);
}])->get();
```

## Eager Loading (N+1 Problem)

```php
// ❌ Bad: N+1 query problem
$posts = Post::all();
foreach ($posts as $post) {
    echo $post->author->name; // Separate query for each post
}

// ✅ Good: Eager loading
$posts = Post::with('author')->get();
foreach ($posts as $post) {
    echo $post->author->name; // No additional queries
}

// Nested eager loading
$posts = Post::with('author.profile', 'comments.user')->get();
```

## Preventing Lazy Loading

```php
// config/app.php (or in AppServiceProvider)
Model::preventLazyLoading();

// Now this will throw an exception
$post = Post::first();
echo $post->author->name; // Exception!

// Fix with eager loading
$post = Post::with('author')->first();
echo $post->author->name; // OK
```

## Default Models

```php
// app/Models/Post.php
class Post extends Model
{
    public function user()
    {
        return $this->belongsTo(User::class)->withDefault([
            'name' => 'Guest Author'
        ]);
    }
}

// Or with a default model instance
public function user()
{
    return $this->belongsTo(User::class)->withDefault(function ($user) {
        $user->name = 'Guest Author';
    });
}
```

## Relationship Existence Checks

```php
// Check if relationship exists
if ($user->posts()->exists()) {
    // User has posts
}

// Check if specific model exists
if ($user->posts()->where('title', 'Test')->exists()) {
    // Post exists
}

// Count relationships
$postCount = $user->posts()->count();
```

## Best Practices

1. **Always eager load**: Avoid N+1 queries
2. **Use query builder methods**: Chain where(), orderBy(), etc.
3. **Prevent lazy loading**: Enable in production
4. **Name relationships clearly**: Use plural for hasMany, singular for belongsTo
5. **Use constraints**: Filter related models when eager loading
6. **Cache counts**: Use `withCount()` for display purposes
7. **Use default models**: Avoid null checks in views
