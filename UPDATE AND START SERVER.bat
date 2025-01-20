@echo off

echo Updating SpaceNinjaServer...
echo.
git pull
echo.

if exist static\data\0\ (
	echo Updating stripped assets...
	cd static\data\0\
	echo.
	git pull
	echo.
	cd ..\..\..\
)

echo Updating dependencies...
call npm i
echo.

echo Building files...
call npm run build

echo Starting SpaceNinjaServer...
call npm run start

echo.
echo.
title Error - SpaceNinjaServer
color 0C
echo SpaceNinjaServer seems to have crashed.
:crashMsg
pause > nul
goto crashMsg
