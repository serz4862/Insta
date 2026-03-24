const path = require('path');
const fs = require('fs');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;

function packageRoot(moduleName) {
  return path.dirname(
    require.resolve(path.join(moduleName, 'package.json'), { paths: [projectRoot] })
  );
}

/** Shipped inside `firebase`; not always hoisted to the repo root. */
function firebaseNestedAuthRoot() {
  const nested = path.join(
    projectRoot,
    'node_modules',
    'firebase',
    'node_modules',
    '@firebase',
    'auth'
  );
  if (fs.existsSync(path.join(nested, 'package.json'))) {
    return nested;
  }
  return packageRoot('@firebase/auth');
}

const config = getDefaultConfig(projectRoot);

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  '@firebase/app': packageRoot('@firebase/app'),
  '@firebase/auth': firebaseNestedAuthRoot(),
  '@firebase/component': packageRoot('@firebase/component'),
  '@firebase/logger': packageRoot('@firebase/logger'),
  '@firebase/util': packageRoot('@firebase/util'),
};

module.exports = config;
