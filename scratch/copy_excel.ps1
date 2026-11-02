$src = 'C:\Users\ADMIN\Downloads\HF_GDMT_Adherence_Audit_2026-10-31 (3).xlsx'
$dst = 'C:\Users\ADMIN\AppData\Local\Temp\audit_temp.xlsx'
$inStream = [System.IO.File]::Open($src, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, [System.IO.FileShare]::ReadWrite)
$outStream = [System.IO.File]::Create($dst)
$inStream.CopyTo($outStream)
$inStream.Close()
$outStream.Close()
Write-Host "Copied successfully to temp!"

