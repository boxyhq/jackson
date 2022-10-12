#!/bin/bash

if [ "$RUN_MIGRATION" == 1 ]
then
    echo "Initiating Migration..."

    cd ./npm
    # && ts-node --transpile-only ./node_modules/typeorm/cli.js migration:run -d typeorm.ts
    if [ "$DB_ENGINE" = "mongo" ]
    then
        npm run db:migration:run:$DB_ENGINE
    else
        ts-node --transpile-only ./node_modules/typeorm/cli.js migration:run -d typeorm.ts
    fi
    echo "Migration Finished..."

    cd ..
fi
echo "Starting Jackson service..."
{
    # For docker environment
    node server.js
} || {
    # For local environment
    npm run dev
}