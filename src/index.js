import * as types from '@babel/types';
import isValidPath from 'is-valid-path';

function findOptionFromSource(source, state) {
  const opts = state.opts;
  if (opts[source]) return source;
  const opt = Object.keys(opts).find((key => !isValidPath(key) && new RegExp(key).test(source)));
  if (opt) return opt;
}

function getMatchesFromSource(opt, source) {
  const regex = new RegExp(opt, 'g');
  const matches = [];
  let m;
  while ((m = regex.exec(source)) !== null) {
    if (m.index === regex.lastIndex) regex.lastIndex++;
    m.forEach((match) =>  matches.push(match));
  }
  return matches;
}

function transform(transformOption, importName, matches) {
  if (typeof transformOption === 'function') {
    return transformOption(importName, matches);
  }

  return transformOption.replace(/\$\{\s?([\w\d]*)\s?\}/ig, function (str, g1) {
    if (g1 === 'member') return importName;
    return matches[g1];
  });
}

/**
 * Camel conversion horizontal line interval
 * @param {String} name 
 * 
 * `CopyToClipboard` => `copy-to-clipboard`
 */
function toLine(name) {
  return name.replace(/\B([A-Z])/g, '-$1').toLowerCase()
}

const plugName = 'transform-uiw-import';

export default () => {
  return {
    name: plugName,
    visitor: {
      // https://babeljs.io/docs/en/babel-types#importdeclaration
      ImportDeclaration(path, state) {
        // https://github.com/babel/babel/tree/master/packages/babel-types#timportdeclarationspecifiers-source

        // path.node has properties 'source' and 'specifiers' attached.
        // path.node.source is the library/module name, aka 'uiw'.
        // path.node.specifiers is an array of ImportSpecifier | ImportDefaultSpecifier | ImportNamespaceSpecifier
        
        const uiwConf = {
          // transform: 'uiw/lib/cjs/${member}',
          transform: importName => `uiw/lib/cjs/${toLine(importName)}`,
        }
        state.opts.uiw = state.opts.uiw ? {...uiwConf, ...state.opts.uiw} : uiwConf;

        const { node } = path;
        const { source, specifiers } = node;
        const opt = findOptionFromSource(source.value, state); // aka 'uiw'
        const isRegexp = opt && !isValidPath(opt);
        const opts = state.opts[opt]; // this options
        if (!opts) return;
        if (!opts.transform) {
          throw new Error(`${plugName}: transform option is required for module '${source.value}'. `);
        }
        const transforms = [];
        const fullImports = path.node.specifiers.filter((specifier) => specifier.type !== 'ImportSpecifier' );
        const memberImports = path.node.specifiers.filter((specifier) => specifier.type === 'ImportSpecifier' );

        if (fullImports.length > 0) {
          // Examples of "full" imports:
          //      import * as name from 'module'; (ImportNamespaceSpecifier)
          //      import name from 'module'; (ImportDefaultSpecifier)
          if (opts.preventFullImport) {
            throw new Error(`${plugName}: import of entire module '${source.value}' not allowed due to preventFullImport setting.`);
          }
          if (memberImports.length > 0) {
            // Swap out the import with one that doesn't include member imports.  Member imports should each get their own import line
            // transform this:
            //      import Bootstrap, { Grid } from 'react-bootstrap';
            // into this:
            //      import Bootstrap from 'react-bootstrap';
            transforms.push(types.importDeclaration(fullImports, types.stringLiteral(source.value)));
          }
        }

        const matches = isRegexp ? getMatchesFromSource(opt, source.value) : [];

        memberImports.forEach((memberImport) => {
          // Examples of member imports:
          //      import { member } from 'module'; (ImportSpecifier)
          //      import { member as alias } from 'module' (ImportSpecifier)

          // transform this:
          //      import { Grid as gird } from 'react-bootstrap';
          // into this:
          //      import gird from 'react-bootstrap/lib/Grid';
          // or this, if skipDefaultConversion = true:
          //      import { Grid as gird } from 'react-bootstrap/lib/Grid';
          const importName = memberImport.imported.name;
          const replace = transform(opts.transform, importName, matches);

          const newImportSpecifier = (opts.skipDefaultConversion)
            ? memberImport
            : types.importDefaultSpecifier(types.identifier(memberImport.local.name));

          transforms.push(types.importDeclaration(
            [newImportSpecifier],
            types.stringLiteral(replace)
          ));
        });

        if (transforms.length > 0) {
          path.replaceWithMultiple(transforms);
        }
      },
    }
  };
}
