@echo off
echo Regenerating Prisma Client...
echo.
echo IMPORTANT: Make sure your backend server is STOPPED first!
echo.
pause
npx prisma generate
echo.
echo Prisma client regenerated!
echo.
echo Now restart your backend server.
pause

