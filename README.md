# Auto Immutable JS

<p align="center" height="20" width="20" padding="20">
    <img src="docs/src/images/logo.svg" height="240" width="640"
    i-style="border:1px solid #ffffff" --
    ></img>
</p>

# Introduction
**Auto Immutable** is a self enforcing immutable class. Its values are private and readonly.
<ul>
    <li>
        It can only ever be <strong>updated</strong> by its <strong><code>set(...)</code></strong> method.
    </li>
    <li>
        It can only ever be <strong>read</strong> by its <strong><code>get(...)</code></strong> method.
    </li>
</ul>

### Name:
<strong>@webkrafters/auto-immutable</strong><br />
<strong>Alternate:</strong> auto-immutable.js

# Installation
npm install --save @webkrafters/auto-immutable

# Getting Started

## Obtain Immutable Instance

```tsx
// my-immutable.ts

import type { Immutable } from '@webkrafters/auto-immutable';

const initValue = { a: { b: { c: 24 } } };

const immutable = new Immutable( initValue );

export default immutable;
```

## Access Immutable instance

```tsx
// read-my-immutable.ts

import myImmutable from './my-immutable';

const reference = myImmutable.connect();

const objectPath = 'a.b.c';

const data : AccessorResponse = reference.get( objectPath );

console.log( data ); // {'a.b.c', 24}
```





import {
    clearTimeout,
    setTimeout
} from '@webkrafters/long-count';

const timeout = setTimeout(
    callback : VoidFn,
    delay? : Delay,
    options? : boolean | Partial<Options>,
    ...args : Array<any>
); // => LongCounter

clearTimeout( timeout );
// or clearTimeout( timeout.id );
// or clearTimeout( timeout.valueOf() );
```

## Interval

```tsx
import type {
    Delay,
    Options,
    VoidFn
} from '@webkrafters/long-count';

import {
    clearInterval,
    setInterval
} from '@webkrafters/long-count';

const interval = setInterval(
    callback : VoidFn,
    delay? : Delay,
    options? : boolean | Partial<Options>,
    ...args : Array<any>
); // => Interval (a child LongCounter)

clearInterval( interval );
// or clearInterval( interval.id );
// or clearInterval( interval.valueOf() );
```

# Events

The `LongCounter` instance is an observable notifying observers of the events.<br />
*See **[Event Types](#etypes)** in the next section.* 

```tsx
import type {
    EventType,
    VoidFn
} from '@webkrafters/long-count';

import { setTimeout } from '@webkrafters/long-count';

const timeout = setTimeout( ... ); // => LongCounter
timeout.addEventListener(
    eventType : EventType,
    listener : VoidFn
); // => void
timeout.dispatchEvent(
    eventType : EventType,
    ...args : Array<any>
); // => void
timeout.removeEventListener(
    eventType : EventType,
    listener : VoidFn
); // => void

```

<h2 id="etypes">Event Types</h2>
<table BORDER=2>
    <thead>
        <tr>
            <td><strong>Type</strong></td>
            <td><strong>Event observed</strong></td>
        </tr>
    </thead>
    <tbody VALIGN=TOP>
        <tr>
            <td><strong>cycleEnding</strong></td>
            <td>
                End of a delay segment. A delay segment equals the platform time delay limit or the entire delay when less than the device limit.
            </td>
        </tr>
        <tr>
            <td><strong>cycleStarted</strong></td>
            <td>
                Start of a delay segment. A delay segment equals the platform time delay limit or the entire delay when less than the device limit.
            </td>
        </tr>
        <tr>
            <td><strong>exit</strong></td>
            <td>
                Eve of a LongCounter disposal.
            </td>
        </tr>
        <tr>
            <td><strong>resume</strong></td>
            <td>
                Page receiving visibility (e.g. when <strong>waking</strong> from device "sleep" mode).
            </td>
        </tr>
        <tr>
            <td><strong>suspend</strong></td>
            <td>
                Page losing visibility (e.g. when <strong>entering</strong> device "sleep" mode).
            </td>
        </tr>
    </tbody>
</table>

# License
MIT
