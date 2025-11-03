# BUS

Nov 1 2025 - @anselm

Bus implements a variation on a pub-sub architecture with these qualities:

- a single method or interface packages up the entire request including the pattern to match - right now bus has one method bus.event().

- this approach allows entire collections of observers and events to be loaded up from separate files - in turn this allows declarative collections of events - and forms a way to build systems out of parts as a whole.

See also [DESIGN.md](DESIGN.md)

## Usage

### Basic Observer (observe everything)

```typescript
import { Bus } from '@social/orbital';

const bus = new Bus();

// Register an observer
const myObserver = {
  meta: { title: 'my observer' },
  on_entity: async (blob, bus) => {
    if (blob.message) {
      console.log('Received:', blob.message);
    }
  }
};

await bus.event(myObserver);

// Publish an event
await bus.event({ message: 'Hello World' });
```

### Filtered Observer

```typescript
// Only trigger when blob has a 'user' property
const userObserver = {
  meta: { title: 'user observer' },
  on_entity: {
    filter: 'user',
    resolve: async (blob, bus) => {
      console.log('User event:', blob.user);
    }
  }
};

await bus.event(userObserver);
await bus.event({ user: 'Alice' }); // Will trigger
await bus.event({ message: 'Hi' }); // Won't trigger
```

### Priority Ordering

```typescript
// Lower priority number = called first
const highPriorityObserver = {
  meta: { title: 'high priority' },
  on_entity: {
    priority: 1,
    resolve: async (blob, bus) => {
      console.log('Called first');
    }
  }
};

const lowPriorityObserver = {
  meta: { title: 'low priority' },
  on_entity: {
    priority: 2,
    resolve: async (blob, bus) => {
      console.log('Called second');
    }
  }
};

await bus.event(lowPriorityObserver);
await bus.event(highPriorityObserver);
await bus.event({ test: true }); // Logs in priority order
```

### Dynamic Loading

```typescript
import { Bus, loader } from '@social/orbital';

const bus = new Bus();

// Register the loader
await bus.event(loader);

// Load modules dynamically
await bus.event({
  load: './my-observer.js',
  anchor: process.cwd()
});

// Or load multiple modules
await bus.event({
  load: ['./observer1.js', './observer2.js'],
  anchor: process.cwd()
});
```

