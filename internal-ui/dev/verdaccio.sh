#!/bin/zsh -ex

# TODO: Make this generic so everyone can run it

VERSION=0.0.0

# Unpublish the current version
npm unpublish --registry http://localhost:4873/ @boxyhq/internal-ui@$VERSION

# Build the package
rm -rf dist

# Update package.json main and types
jq '.main = "./dist/index.js" | .types = "./dist/index.d.ts"' package.json > tmp.json && mv tmp.json package.json

npm run build

# Publish
npm publish --registry http://localhost:4873/

# Install the published version in `boxyhq/jackson`
# cd ../../jackson
# npm uninstall @boxyhq/internal-ui
# npm i --save-exact --registry http://localhost:4873/ @boxyhq/internal-ui@$VERSION
# rm -rf .next

# revert package.json main and types
jq '.main = "./src/index.ts" | .types = "./src/index.d.ts"' package.json > tmp.json && mv tmp.json package.json

# Install the published version in `boxyhq/saas-app`
cd ../../saas-app
npm uninstall @boxyhq/internal-ui
npm i --save-exact --registry http://localhost:4873/ @boxyhq/internal-ui@$VERSION --force
rm -rf .next