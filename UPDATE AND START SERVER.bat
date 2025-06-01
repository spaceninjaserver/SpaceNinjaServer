@echo off

echo Updating SpaceNinjaServer...
git fetch --prune
git stash
git checkout -f origin/main

if exist static\data\0\ (
	echo Updating stripped assets...
	cd static\data\0\
	git pull
	cd ..\..\..\
)

echo Updating dependencies...
call npm i --omit=dev

call npm run build
if %errorlevel% == 0 (
	call npm run start
	echo SpaceNinjaServer seems to have crashed.
)
:a
pause > nul
goto a
