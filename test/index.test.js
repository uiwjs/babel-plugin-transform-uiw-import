import { transformSync } from "@babel/core";
import { join } from 'path';
import { readFileSync, readdirSync } from 'fs';
import plugin from '../src/index';

const pluginBaseOpts = {
  "presets": [],
};

const fixtureDir = join(__dirname, 'fixtures');
const fixtures = readdirSync(fixtureDir);

fixtures.map((caseName) => {
  const inputFile = join(fixtureDir, caseName, 'input.js');
  const outputFile = join(fixtureDir, caseName, 'output.js');
  test(`should work with ${caseName.split('-').join(' ')}`, () => {
    if (caseName === 'default-imports') {
      pluginBaseOpts.plugins = [
        [plugin]
      ]
    } else if (caseName === 'member-imports') {
      pluginBaseOpts.plugins = [
        [plugin]
      ]
    } else if (caseName === 'imports') {
      pluginBaseOpts.plugins = [
        [plugin, {
          "uiw": {
            "transform": "uiw/lib/cjs/${member}",
          },
        }]
      ]
    } else if(caseName === 'regex-expressions') {
      pluginBaseOpts.plugins = [
        [plugin, {
          "package-(\\w+)\/?(((\\w*)?\/?)*)": {
            "transform": "package-${1}/${2}/${member}",
          },
        }]
      ]
    } else if(caseName === 'skip-default-conversion') {
      pluginBaseOpts.plugins = [
        [plugin, {
          "date-fns": {
            "transform": "date-fns/lib/cjs/${member}",
            "skipDefaultConversion": true,
          },
        }]
      ]
    } else if(caseName === 'prevent-full-import') {
      pluginBaseOpts.plugins = [
        [plugin, {
          "date-fns": {
            "transform": "uiw/lib/cjs/${member}",
            "preventFullImport": true,
          },
          // "../component": {}
        }]
      ];
      const err = new Error(`unknown: transform-uiw-import: import of entire module 'date-fns' not allowed due to preventFullImport setting.`)
      expect(() => transformSync(readFileSync(inputFile), pluginBaseOpts)).toThrowError(err);
      return;

    } else if(caseName === 'transform-missing') {
      pluginBaseOpts.plugins = [
        [plugin, {
          "date-fns": {
            "transform": null,
          },
        }]
      ];
      const err = new Error(`unknown: transform-uiw-import: transform option is required for module 'date-fns'. `)
      expect(() => transformSync(readFileSync(inputFile), pluginBaseOpts)).toThrowError(err);
      return;
    } else if(caseName === 'transform-funtion') {
      pluginBaseOpts.plugins = [
        [plugin, {
          "date-fns": {
            "transform": importName => `date-fns/${importName}`,
          },
        }]
      ];
    } else {
      pluginBaseOpts.plugins = [];
      pluginBaseOpts.presets = [["@babel/preset-env", { "modules": false }]];
    }
    const code = transformSync(readFileSync(inputFile), pluginBaseOpts).code;
    const expected = readFileSync(outputFile).toString();
    expect(code).toBe(expected);
  });
});
