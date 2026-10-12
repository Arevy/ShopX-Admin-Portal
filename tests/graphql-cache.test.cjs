const {test} = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const ts = require('typescript')
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(
  fs.readFileSync(filename, 'utf8'), {compilerOptions: {module: ts.ModuleKind.CommonJS}},
).outputText, filename)
const {isPublicCacheableQuery} = require('../src/server/graphql/operationMetadata.ts')

test('only anonymous catalog and published content queries can share a cache', () => {
  assert(isPublicCacheableQuery('query Catalog { getProducts { id } getCmsPages { slug } }'))
  assert(isPublicCacheableQuery('query { ...Catalog } fragment Catalog on Query { items: getProducts { id } }'))
  for (const headers of [{cookie: 'sid=test'}, {Authorization: 'Bearer test'}]) {
    assert(!isPublicCacheableQuery('query { getProducts { id } }', headers))
  }
})
test('private aliases, fragments and mixed queries cannot bypass backend authorization', () => {
  for (const query of [
    'query { getUserContext(userId:"1") { user { id } } }',
    'query { getProducts { id } hidden: customerSupport { viewer { id } } }',
    'query { ...Private } fragment Private on Query { getWishlist(userId:"1") { products { id } } }',
    'query { ...A } fragment A on Query { ...A }',
    'query Public { getProducts { id } } query Private { getUsers { id } }',
    'mutation { logout }', 'invalid document',
  ]) assert(!isPublicCacheableQuery(query), query)
})
