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
if [ $? -eq 1 ]
then
    echo "Migration Failed..."
    exit 1
fi
echo "Migration Finished..."

cd ..

