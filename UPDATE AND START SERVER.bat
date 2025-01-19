@echo off

echo Updating SpaceNinjaServer...
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
