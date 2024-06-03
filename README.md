# pm2-ecosystem

Type-safe [PM2] configurations without the `pm2` package - [quick start](#quick-start)

[PM2]: https://pm2.keymetrics.io/

## Justification

PM2 does provide TypeScript types out-of-the box.

```js
module.exports = {
  /** @type {import('pm2').StartOptions[]} */
  apps: [{ name: 'app', script: './app.js' }],
};
```

However, `pm2` is not meant to be installed locally.

```shell
# Reference https://pm2.keymetrics.io/docs/usage/quick-start/
npm install pm2@latest -g
yarn global add pm2
```

Since there is no `@types/pm2` package, use this instead.

## Quick Start

```shell
npm i pm2-ecosystem -D
pnpm i pm2-ecosystem -D
```

```js
// Method 1: Using the `defineApp` function

const { defineApp } = require('pm2-ecosystem');

module.exports = {
  apps: [
    defineApp({ name: 'app1', script: './app1.js' }),
    defineApp({ name: 'app2', script: './app2.js' }),
    // ...
  ],
};

// Method 2: Using JSDoc

module.exports = {
  /** @type {import('pm2-ecosystem').StartOptions[]} */
  apps: [
    { name: 'app1', script: './app1.js' },
    { name: 'app2', script: './app2.js' },
  ],
};
```

## ECMAScript Modules

In a ESM project, the JavaScript configuration file must have the `.cjs` extension.

| Example Filename       | `package.json`       |
| ---------------------- | -------------------- |
| `ecosystem.config.js`  | `"type": "commonjs"` |
| `ecosystem.config.cjs` | `"type": "module"`   |

```shell
# If the filename is `ecosystem.config.js`
pm2 start # the filename can be omitted.
pm2 start ecosystem.config.js

# If not, the filename must be specified.
pm2 start ecosystem.config.cjs
pm2 start pm2.config.cjs
```
