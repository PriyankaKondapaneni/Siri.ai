@echo off
REM Daily sip-quant job for Windows Task Scheduler.
REM Set SIPQUANT_PYTHON below to your environment's python.exe
REM (in an activated env: `where python`).
set SIPQUANT_PYTHON=C:\Users\you\miniconda3\envs\sipquant\python.exe
cd /d "%~dp0.."
if not exist logs mkdir logs
echo === %date% %time% === >> logs\notify.log
"%SIPQUANT_PYTHON%" -m sipquant.notify daily >> logs\notify.log 2>&1
