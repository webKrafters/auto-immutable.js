# Auto Immutable JS

<p align="center" height="20" width="20" padding="20">
    <img src="docs/src/images/logo.svg" height="240" width="640"
    i-style="border:1px solid #ffffff" --
    ></img>
</p>

# Introduction
**Auto Immutable** is a self enforcing immutable class. Its internal data are private and readonly.
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

# Quick Start

Please see **[Full documentation](https://auto-immutable.js.org)** before using. ***Recommended.***

## Obtain an Immutable Instance

```tsx
/* my-immutable.ts */

import AutoImmutable from '@webkrafters/auto-immutable';

const initValue = { a: { b: { c: 24 } } };

const aImmutable = new Immutable( initValue );

export default aImmutable;
```

## Connect to an AutoImmutable Instance

```tsx
/* read-my-immutable.ts */

import myImmutable from './my-immutable';

const consumer = myImmutable.connect();

const objectPath = 'a.b.c';

const data : AccessorResponse = consumer.get( objectPath );

console.log( data ); // { 'a.b.c', 24 }
```

### Manually Discard an AutoImmutable Consumer.

```tsx
consumer.disconnect();
```

### Manually Discard an AutoImmutable Instance.

```tsx
myImmutable.close();
```

# License
MIT
