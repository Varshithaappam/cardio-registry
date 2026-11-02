$src = 'C:\Users\ADMIN\Downloads\HF_GDMT_Adherence_Audit_2026-10-31 (5).xlsx'
$dst = 'c:\Users\ADMIN\Desktop\projects\cardio-registry\scratch\latest_audit.xlsx'
$fileStream = [System.IO.File]::Open($src, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, [System.IO.FileShare]::ReadWrite)
$outStream = [System.IO.File]::Create($dst)
$fileStream.CopyTo($outStream)
$fileStream.Close()
$outStream.Close()
Write-Host 'Copied successfully'

