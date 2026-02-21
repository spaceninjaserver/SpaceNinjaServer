@echo off

echo Updating SpaceNinjaServer...
git fetch --prune
if %errorlevel% == 0 (
	git stash
	git checkout -f origin/main

	if exist static\data\0\ (
		echo Updating stripped assets...
		cd static\data\0\
		git pull
		cd ..\..\..\
	)

	echo Updating dependencies...
	node scripts/raw-precheck.js > NUL
	if %errorlevel% == 0 (
		call npm i --omit=dev --omit=optional --no-audit
		call npm run raw
	) else (
		call npm i --omit=dev --no-audit
		call npm run build
		if %errorlevel% == 0 (
			call npm run start
		)
	)
	echo SpaceNinjaServer seems to have crashed.
)

:a
pause > nul
goto a
