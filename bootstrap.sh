#!/bin/bash

if [ "$RUN_MIGRATION" == 1 ]
then
    echo "Initiating Migration..."

    cd ./npm && ts-node --transpile-only ./node_modules/typeorm/cli.js migration:run -d typeorm.ts
    echo "Migration Finished..."

    cd ..
fi
echo "Starting Jackson service..."
npm run start