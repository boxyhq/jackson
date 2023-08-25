#!/bin/sh

echo "Initiating Migration..."
export NODE_PATH=$(npm root -g)

cd ./npm
if [ "$DB_ENGINE" = "mongo" ]
then
    migrate-mongo up
else
    ts-node --transpile-only --project tsconfig.json $NODE_PATH/typeorm/cli.js migration:run -d ./typeorm.ts
fi
echo "Migration Finished..."

cd ..

