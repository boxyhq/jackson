#!/bin/zsh -ex

# TODO: Make this generic so everyone can run it

VERSION=0.0.0

# Unpublish the current version
npm unpublish --registry http://localhost:4873/ @boxyhq/security-sinks@$VERSION --force

# Build the package
rm -rf dist
npm run build

# Publish
npm publish --registry http://localhost:4873/