git pull
call npm i
if exist static\data\0\ (
	cd static\data\0\
	git pull
	cd ..\..\..\
)
call npm run build
call npm run start
