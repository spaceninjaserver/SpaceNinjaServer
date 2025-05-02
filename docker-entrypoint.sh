#!/bin/bash
set -e

# Set up the configuration file using environment variables.
echo '{
	"logger": {
	  "files": true,
	  "level": "trace",
	  "__valid_levels": "fatal, error, warn, info, http, debug, trace"
	}
}
' > config.json

for config in $(env | grep "APP_")
do
  var=$(echo "${config}" | tr '[:upper:]' '[:lower:]' | sed 's/app_//g' | sed -E 's/_([a-z])/\U\1/g' | sed 's/=.*//g')
  val=$(echo "${config}" | sed 's/.*=//g')
  jq --arg variable "$var" --arg value "$val" '.[$variable] += try [$value|fromjson][] catch $value' config.json > config.tmp
  mv config.tmp config.json
done

npm i --omit=dev
npm run build
exec npm run start
