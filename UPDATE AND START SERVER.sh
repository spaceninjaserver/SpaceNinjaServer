#!/bin/bash

echo "Updating SpaceNinjaServer..."
git fetch --prune
if [ $? -eq 0 ]; then
    git stash
    git checkout -f origin/main

    if [ -d "static/data/0/" ]; then
        echo "Updating stripped assets..."
        cd static/data/0/
        git pull
        cd ../../../
    fi

    echo "Updating dependencies..."
    node scripts/raw-precheck.js > /dev/null
    if [ $? -eq 0 ]; then
        npm i --omit=dev --omit=optional
        npm run raw
    else
        npm i --omit=dev
        npm run build
        if [ $? -eq 0 ]; then
            npm run start
        fi
    fi
    echo "SpaceNinjaServer seems to have crashed."
fi
