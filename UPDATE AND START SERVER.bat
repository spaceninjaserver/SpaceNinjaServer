@echo off

echo Updating SpaceNinjaServer...
git config remote.origin.prune true
git pull

if exist static\data\0\ (
	echo Updating stripped assets...
	cd static\data\0\
	git pull
	cd ..\..\..\
)

echo Updating dependencies...
call npm i

call npm run build
call npm run start

echo SpaceNinjaServer seems to have crashed.
:a
pause > nul
goto a
