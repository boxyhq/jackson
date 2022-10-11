#!/bin/bash

if [ "$RUN_MIGRATION" == 1 ]
then
    echo "Initiating Migration..."

    cd ./npm
    # && ts-node --transpile-only ./node_modules/typeorm/cli.js migration:run -d typeorm.ts
    if [ "$DB_ENGINE" == "sql" ]
    then
        npm run db:migration:run:$DB_TYPE
    else
        npm run db:migration:run:$DB_ENGINE
    fi
    echo "Migration Finished..."

    cd ..
fi
echo "Starting Jackson service..."
npm run start