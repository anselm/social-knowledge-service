# bus

Bus implements a variation on a pub-sub architecture with these qualities:

- a single method or interface packages up the entire request including the pattern to match - this is more flexible since the pattern doesn't have to be baked into the source code explicitly.

## Usage

### Basic Example

```typescript
import { Bus } from '@social/bus';

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
import { Bus, loader } from '@social/bus';

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

## History for context

It's worth knowing a bit of the history here for context:

- Nodejs itself (2009 Ryan Dahl) was designed around libuv, a C event loop that waits on file descriptors and invokes callbacks when I/O is ready.
To make that feel natural in JavaScript, Dahl baked in a tiny event abstraction — so that every async API could speak in the same dialect: on('data'), on('end'), on('error'), etc. That gave us this pattern that is still used today:

```
const fs = require('fs');
const stream = fs.createReadStream('file.txt');
stream.on('data', chunk => ...);
stream.on('end', () => ...);
```

Dahl's specific design philosophy, which he discusses in his early talks, is that Node should have non-blocking concurrency. So there's a tiny pub/sub scheme called EventEmitter and synchronous dispatching and no dependencies. EventEmitter2 takes this much further and is worth looking at as well. Projects like NestJS wrap EventEmitter2 using decorators.

- Browsers DOM events (addEventListener / dispatchEvent) also use an event model.

- The 'Gang of Four' (1994) formalized this pattern - although Node was the first framework to bake this pattern into their runtime. See https://en.wikipedia.org/wiki/Observer_pattern

- In general Unix signal philosophy — processes receive async "events" (SIGTERM, etc.); process.on('exit') mirrors this also.

- The whole GUI/event-loop culture (Smalltalk → MVC; Java; Qt) → Smalltalk's MVC (late '70s at PARC) framed UIs as models broadcasting changes to views/controllers

- Java popularized the Delegation Event Model with strongly-typed listeners; Qt made signals/slots idiomatic C++ for decoupled notifications. All of that normalized "register a handler for an event name/signature; fire it later." 

- You may also want to look at CRDTs and event replay systems of various flavors.
