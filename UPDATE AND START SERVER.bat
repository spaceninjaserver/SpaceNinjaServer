git pull
if exist static\data\0\ (
	cd static\data\0\
	git pull
	cd ..\..\..\
)
call npm i
call npm run build
call npm run start
