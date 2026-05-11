@echo off
cd /d "%~dp0"
set PYTHONPATH=%~dp0
for /f "tokens=*" %%i in ('type ..\\.env') do set %%i
C:\Users\jumpe\AppData\Local\Programs\Python\Python312\python.exe -m uvicorn main:app --reload --port 8000
