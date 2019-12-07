babel-plugin-transform-uiw-import
===

[![NPM version](https://img.shields.io/npm/v/babel-plugin-transform-uiw-import.svg?style=flat)](https://npmjs.org/package/babel-plugin-transform-uiw-import)
[![Build Status](https://img.shields.io/travis/uiwjs/babel-plugin-transform-uiw-import.svg?style=flat)](https://travis-ci.org/uiwjs/babel-plugin-transform-uiw-import)
[![Coverage Status](https://coveralls.io/repos/github/uiwjs/babel-plugin-transform-uiw-import/badge.svg?branch=master)](https://coveralls.io/github/uiwjs/babel-plugin-transform-uiw-import?branch=master)

Modular import uiw plugin for babel. compatible with [**uiw**](https://github.com/uiwjs/uiw), [antd](https://www.npmjs.com/package/antd), [lodash](https://www.npmjs.com/package/lodash), material-ui, and so on.

## Usage

```bash
npm install babel-plugin-transform-uiw-import --save-dev
```

Via `.babelrc` or `babel-loader`.

```js
{
  "plugins": [
    ["babel-plugin-transform-uiw-import"]
  ]
}
```

```js
// Input Code
import { Alert } from 'uiw';
import { CopyToClipboard } from 'uiw';
import { DateInput, DatePicker } from 'uiw';

// Output   ↓ ↓ ↓ ↓ ↓ ↓
import Alert from "uiw/lib/cjs/alert";
import CopyToClipboard from "uiw/lib/cjs/copy-to-clipboard";
import DateInput from "uiw/lib/cjs/date-input";
import DatePicker from "uiw/lib/cjs/date-picker";
```

Output Result

```diff
- import { Alert } from 'uiw';
+ import Alert from "uiw/lib/cjs/alert";
- import { CopyToClipboard } from 'uiw';
+ import CopyToClipboard from "uiw/lib/cjs/copy-to-clipboard";
- import { DateInput, DatePicker } from 'uiw';
+ import DateInput from "uiw/lib/cjs/date-input";
+ import DatePicker from "uiw/lib/cjs/date-picker";
```

## Options

```typescript
export interface Options {
  [key: string]: {
    transform: (importName: string) => void | string;
    preventFullImport?: boolean;
    skipDefaultConversion?: boolean;
  }
}
```

**Default Options**

```js
/**
 * Camel conversion horizontal line interval
 * @param {String} name 
 * `CopyToClipboard` => `copy-to-clipboard`
 */
function toLine(name) {
  return name.replace(/\B([A-Z])/g, '-$1').toLowerCase()
}

// The default Options
{
  uiw: {
    transform: importName => `uiw/lib/cjs/${toLine(importName)}`,
  }
}
```

#### `transform: string | function(importName: string): string`

The library name to use instead of the one specified in the import statement. `${member}` will be replaced with the import name, aka Grid/Row/Col/etc., and `${1-n}` will be replaced by any matched regular expression groups. If using a JS Babel config file, a function may be passed directly. (see [`Programmatic Usage`](#programmatic-usage))

#### `preventFullImport: boolean`

> default `false`
  
Whether or not to throw when an import is encountered which would cause the entire module to be imported.

#### `skipDefaultConversion: boolean`

> default `false`

When set to true, will preserve `import { X }` syntax instead of converting to `import X`.

```js
// Input Code
import { Grid as gird } from 'uiw';
// Output   ↓ ↓ ↓ ↓ ↓ ↓  ====> skipDefaultConversion: true
import { Grid as gird } from 'uiw/lib/Grid';
```

```diff
- import { Grid as gird } from 'uiw';
+ import { Grid as gird } from 'uiw/lib/Grid';
```

## Programmatic Usage

```js
import plugin from 'babel-plugin-transform-uiw-import'
import { transform } from 'babel-core'

// `CopyToClipboard` => `copy-to-clipboard`
function toLine(name) {
  return name.replace(/\B([A-Z])/g, '-$1').toLowerCase();
}
 
function replace (code) {
  return transform(code, {
    babelrc: false,
    plugins: [
      [plugin, {
        'date-fns': {
          transform: importName => `date-fns/${toLine(importName)}`,
          preventFullImport: true,
        },
      }]
    ],
  }).code;
}
 
replace("import { CopyToClipboard } from 'date-fns';")
//=> "import CopyToClipboard from "date-fns/copy-to-clipboard";"
```

## License

MIT © [`Kenny Wong`](https://github.com/jaywcjlove)
