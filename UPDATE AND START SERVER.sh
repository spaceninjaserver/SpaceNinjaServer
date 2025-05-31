#!/bin/bash

echo "Updating SpaceNinjaServer..."
git fetch --prune
git stash
git reset --hard origin/main

if [ -d "static/data/0/" ]; then
    echo "Updating stripped assets..."
    cd static/data/0/
    git pull
    cd ../../../
fi

echo "Updating dependencies..."
npm i --omit=dev

npm run build
if [ $? -eq 0 ]; then
    npm run start
    echo "SpaceNinjaServer seems to have crashed."
fi

