# bus

Bus implements a variation on a pub-sub architecture with these qualities:

- a single method or interface packages up the entire request including the pattern to match - this is more flexible since the pattern doesn't have to be baked into the source code explicitly. for example:

```
const bus = new Bus()
bus.event({args...})
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

- In general Unix signal philosophy — processes receive async “events” (SIGTERM, etc.); process.on('exit') mirrors this also.

- The whole GUI/event-loop culture (Smalltalk → MVC; Java; Qt) → Smalltalk’s MVC (late ’70s at PARC) framed UIs as models broadcasting changes to views/controllers

- Java popularized the Delegation Event Model with strongly-typed listeners; Qt made signals/slots idiomatic C++ for decoupled notifications. All of that normalized “register a handler for an event name/signature; fire it later.” 

- You may also want to look at CRDTs and event replay systems of various flavors.
