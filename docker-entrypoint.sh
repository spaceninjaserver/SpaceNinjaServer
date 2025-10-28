#!/bin/bash
set -e

if [ ! -f conf/config.json ]; then
	jq --arg value "mongodb://mongodb:27017/openWF" '.mongodbUrl = $value' /app/config-vanilla.json > /app/conf/config.json
fi

exec npm run raw -- --configPath conf/config.json
