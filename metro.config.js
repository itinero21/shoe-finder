const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const root = __dirname;
const config = getDefaultConfig(root);

config.resolver.blockList = [
  ...(config.resolver.blockList ?? []),
  new RegExp(`${escapePath(path.join(root, 'node_modules 2'))}\\/.*`),
  new RegExp(`${escapePath(path.join(root, 'dist'))}\\/.*`),
  new RegExp(`${escapePath(path.join(root, '.claude'))}\\/.*`),
];

function escapePath(filePath) {
  return filePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = config;
