# Auto Immutable JS

<p align="center">
  <img height="240" src="logo.svg" width="640"></img>
</p>

# Introduction

**[Auto Immutable](https://auto-immutable.js.org/api/#source)** is a self enforcing immutable class. Its internal data are private and readonly.

It provides [Consumer](https://auto-immutable.js.org/api/#consumer) instances through which it can be read and updated.

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
