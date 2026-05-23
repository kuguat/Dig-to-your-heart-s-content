param([string[]]$Names)
$dir = Split-Path -Parent $MyInvocation.MyCommand.Path
$files = Get-ChildItem "$dir\A_semi_*" | Sort-Object LastWriteTime
if ($files.Count -ne $Names.Count) {
    Write-Host "Mismatch: $($files.Count) temp files vs $($Names.Count) target names"
    exit 1
}
for ($i = 0; $i -lt $files.Count; $i++) {
    $old = $files[$i].FullName
    $new = Join-Path $dir ($Names[$i] + ".png")
    Move-Item -Force $old $new
    Write-Host "$($Names[$i]).png <- $($files[$i].Name)"
}
Write-Host "Renamed $($files.Count) files"
