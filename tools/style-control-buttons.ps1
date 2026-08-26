Add-Type -AssemblyName System.Drawing

$controlSheets = @(
    @{ Path = "docs/images/gui_btn_attack-sheet0.png"; Width = 50; Height = 40 },
    @{ Path = "docs/images/gui_btn_attack_2-sheet0.png"; Width = 50; Height = 40 },
    @{ Path = "docs/images/gui_btn_attack_2-sheet1.png"; Width = 50; Height = 40 },
    @{ Path = "docs/images/gui_btn_interact-sheet0.png"; Width = 50; Height = 50 },
    @{ Path = "docs/images/gui_btn_interact-sheet1.png"; Width = 50; Height = 50 },
    @{ Path = "docs/images/gui_btn_switch-sheet0.png"; Width = 50; Height = 50 },
    @{ Path = "docs/images/gui_btn_switch-sheet1.png"; Width = 50; Height = 50 },
    @{ Path = "docs/images/gui_btn_switch-sheet2.png"; Width = 50; Height = 50 }
)

$outerRing = [System.Drawing.Color]::FromArgb(235, 55, 51, 40)
$middleRing = [System.Drawing.Color]::FromArgb(235, 157, 143, 105)
$innerRing = [System.Drawing.Color]::FromArgb(225, 83, 79, 62)

foreach ($sheet in $controlSheets) {
    $resolvedPath = (Resolve-Path -LiteralPath $sheet.Path).Path
    $source = [System.Drawing.Bitmap]::FromFile($resolvedPath)
    $styled = New-Object System.Drawing.Bitmap(
        $source.Width,
        $source.Height,
        [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

    for ($frameTop = 0; $frameTop -lt $source.Height; $frameTop += $sheet.Height + 2) {
        for ($frameLeft = 0; $frameLeft -lt $source.Width; $frameLeft += $sheet.Width + 2) {
            if ($frameLeft + $sheet.Width -gt $source.Width `
                    -or $frameTop + $sheet.Height -gt $source.Height) {
                continue
            }

            $centerX = ($sheet.Width - 1) / 2.0
            $centerY = ($sheet.Height - 1) / 2.0
            $radiusX = [Math]::Max(1, $centerX)
            $radiusY = [Math]::Max(1, $centerY)

            for ($y = 0; $y -lt $sheet.Height; $y += 1) {
                for ($x = 0; $x -lt $sheet.Width; $x += 1) {
                    $normalizedX = ($x - $centerX) / $radiusX
                    $normalizedY = ($y - $centerY) / $radiusY
                    $radius = [Math]::Sqrt(
                        $normalizedX * $normalizedX + $normalizedY * $normalizedY)
                    $targetX = $frameLeft + $x
                    $targetY = $frameTop + $y

                    if ($radius -gt 1.0) {
                        $styled.SetPixel(
                            $targetX,
                            $targetY,
                            [System.Drawing.Color]::Transparent)
                    } elseif ($radius -gt 0.92) {
                        $styled.SetPixel($targetX, $targetY, $outerRing)
                    } elseif ($radius -gt 0.84) {
                        $styled.SetPixel($targetX, $targetY, $middleRing)
                    } elseif ($radius -gt 0.78) {
                        $styled.SetPixel($targetX, $targetY, $innerRing)
                    } else {
                        $styled.SetPixel(
                            $targetX,
                            $targetY,
                            $source.GetPixel($targetX, $targetY))
                    }
                }
            }
        }
    }

    $temporaryPath = "$resolvedPath.styled.png"
    $styled.Save($temporaryPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $styled.Dispose()
    $source.Dispose()

    Move-Item -LiteralPath $temporaryPath -Destination $resolvedPath -Force
}
