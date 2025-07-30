#!/bin/bash
set -e

if [ ! -f conf/config.json ]; then
	jq --arg value "mongodb://openwfagent:spaceninjaserver@mongodb:27017/" '.mongodbUrl = $value' /app/config-vanilla.json > /app/conf/config.json
fi

exec npm run start -- --configPath conf/config.json
