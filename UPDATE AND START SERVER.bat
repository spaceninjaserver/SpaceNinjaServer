@echo off

echo Updating SpaceNinjaServer...
git config remote.origin.url https://openwf.io/SpaceNinjaServer.git
git fetch --prune
git stash
git reset --hard origin/main

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
