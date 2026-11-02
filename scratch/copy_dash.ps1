$src = 'C:\Users\ADMIN\Desktop\cardio-registry\dashboard forms and formulae.xlsx'
$dst = 'c:\Users\ADMIN\Desktop\projects\cardio-registry\scratch\dash_copy.xlsx'
$inStream = [System.IO.File]::Open($src, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, [System.IO.FileShare]::ReadWrite)
$outStream = [System.IO.File]::Create($dst)
$inStream.CopyTo($outStream)
$inStream.Close()
$outStream.Close()
Write-Host "Copied dash_copy.xlsx successfully!"
