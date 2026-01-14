# Complexity Tiers (Laravel)

Use this to adapt the level of detail automatically based on project complexity.

## Simple
**Signals**: Small app, basic CRUD, no queues.
**Example**: Migration + model + controller + resource.

## Medium
**Signals**: Policies, resources, validation, tests.
**Example**: API resource + policy + request validation + feature test.

## Complex
**Signals**: Queues, events, multi-tenant, heavy caching.
**Example**: Job pipeline + cache tags + domain services + observability.
