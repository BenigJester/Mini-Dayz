Add-Type -AssemblyName System.Drawing

$projectRoot = Split-Path -Parent $PSScriptRoot
$conceptPath = Join-Path $projectRoot "artifacts/control-layout-concept-v2-native.png"
$mutationPath = Join-Path $projectRoot "artifacts/control-layout-proposal-gun-trunk.png"
$approvedSourceDirectory = Join-Path $PSScriptRoot "approved-control-sources"
$hudSourcePath = Join-Path $approvedSourceDirectory "loadout-plate-source.png"
$outputDirectory = Join-Path $projectRoot "docs/images/modern-controls"
$legacyControlImages = @(
    "gui_btn_attack-sheet0.png",
    "gui_btn_attack_2-sheet0.png",
    "gui_btn_attack_2-sheet1.png",
    "gui_btn_switch-sheet0.png",
    "gui_btn_switch-sheet1.png",
    "gui_btn_switch-sheet2.png",
    "gui_btn_interact-sheet0.png",
    "gui_btn_interact-sheet1.png",
    "gui_btn_reload-sheet0.png",
    "gui_btn_zoom-sheet0.png"
)

New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null

function Export-CircularControl {
    param(
        [Parameter(Mandatory = $true)] [string] $SourcePath,
        [Parameter(Mandatory = $true)] [string] $OutputName,
        [Parameter(Mandatory = $true)] [int] $CenterX,
        [Parameter(Mandatory = $true)] [int] $CenterY,
        [Parameter(Mandatory = $true)] [int] $Radius
    )

    $source = [System.Drawing.Bitmap]::FromFile($SourcePath)
    $diameter = $Radius * 2
    $cropped = New-Object System.Drawing.Bitmap(
        $diameter,
        $diameter,
        [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

    for ($y = 0; $y -lt $diameter; $y += 1) {
        for ($x = 0; $x -lt $diameter; $x += 1) {
            $deltaX = $x + 0.5 - $Radius
            $deltaY = $y + 0.5 - $Radius
            $distance = [Math]::Sqrt($deltaX * $deltaX + $deltaY * $deltaY)
            $sourceX = $CenterX - $Radius + $x
            $sourceY = $CenterY - $Radius + $y

            if ($distance -gt $Radius -or $sourceX -lt 0 -or $sourceY -lt 0 `
                    -or $sourceX -ge $source.Width -or $sourceY -ge $source.Height) {
                $cropped.SetPixel($x, $y, [System.Drawing.Color]::Transparent)
                continue
            }

            $pixel = $source.GetPixel($sourceX, $sourceY)
            $edgeAlpha = [Math]::Min(1.0, [Math]::Max(0.0, $Radius - $distance))
            $alpha = [int][Math]::Round($pixel.A * $edgeAlpha)
            $cropped.SetPixel(
                $x,
                $y,
                [System.Drawing.Color]::FromArgb($alpha, $pixel.R, $pixel.G, $pixel.B))
        }
    }

    $target = New-Object System.Drawing.Bitmap(
        256,
        256,
        [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $graphics = [System.Drawing.Graphics]::FromImage($target)
    $graphics.Clear([System.Drawing.Color]::Transparent)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
    $graphics.DrawImage($cropped, 0, 0, 256, 256)
    $graphics.Dispose()

    $outputPath = Join-Path $outputDirectory $OutputName
    $target.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $target.Dispose()
    $cropped.Dispose()
    $source.Dispose()
}

function Export-HudPlate {
    $source = [System.Drawing.Bitmap]::FromFile($hudSourcePath)
    $minimumX = $source.Width
    $minimumY = $source.Height
    $maximumX = -1
    $maximumY = -1

    for ($y = 0; $y -lt $source.Height; $y += 1) {
        for ($x = 0; $x -lt $source.Width; $x += 1) {
            if ($source.GetPixel($x, $y).A -gt 5) {
                $minimumX = [Math]::Min($minimumX, $x)
                $minimumY = [Math]::Min($minimumY, $y)
                $maximumX = [Math]::Max($maximumX, $x)
                $maximumY = [Math]::Max($maximumY, $y)
            }
        }
    }

    if ($maximumX -lt $minimumX -or $maximumY -lt $minimumY) {
        $source.Dispose()
        throw "The generated HUD plate has no visible pixels."
    }

    $sourceRectangle = [System.Drawing.Rectangle]::new(
        [int]$minimumX,
        [int]$minimumY,
        [int]($maximumX - $minimumX + 1),
        [int]($maximumY - $minimumY + 1))
    $target = New-Object System.Drawing.Bitmap(
        512,
        128,
        [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $graphics = [System.Drawing.Graphics]::FromImage($target)
    $graphics.Clear([System.Drawing.Color]::Transparent)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
    $targetRectangle = [System.Drawing.Rectangle]::new(0, 0, 512, 128)
    $graphics.DrawImage(
        $source,
        $targetRectangle,
        $sourceRectangle,
        [System.Drawing.GraphicsUnit]::Pixel)
    $graphics.Dispose()

    $target.Save(
        (Join-Path $outputDirectory "loadout-plate.png"),
        [System.Drawing.Imaging.ImageFormat]::Png)
    $target.Dispose()
    $source.Dispose()
}

function Export-ApprovedControl {
    param(
        [Parameter(Mandatory = $true)] [string] $ImageName
    )

    $sourcePath = Join-Path $approvedSourceDirectory $ImageName
    $source = [System.Drawing.Bitmap]::FromFile($sourcePath)
    $target = New-Object System.Drawing.Bitmap(
        256,
        256,
        [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $graphics = [System.Drawing.Graphics]::FromImage($target)
    $graphics.Clear([System.Drawing.Color]::Transparent)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
    $graphics.DrawImage($source, 0, 0, 256, 256)
    $graphics.Dispose()

    $target.Save(
        (Join-Path $outputDirectory $ImageName),
        [System.Drawing.Imaging.ImageFormat]::Png)
    $target.Dispose()
    $source.Dispose()
}

function Clear-OutsideCircle {
    param(
        [Parameter(Mandatory = $true)] [string] $ImageName
    )

    $imagePath = Join-Path $outputDirectory $ImageName
    $source = [System.Drawing.Bitmap]::FromFile($imagePath)
    $cleaned = New-Object System.Drawing.Bitmap(
        $source.Width,
        $source.Height,
        [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $centerX = ($source.Width - 1) / 2.0
    $centerY = ($source.Height - 1) / 2.0
    # Keep the visible ring intact while removing low-alpha crop residue that
    # sits just beyond the circular button silhouette.
    $radius = [Math]::Min($source.Width, $source.Height) / 2.0 - 1.5

    for ($y = 0; $y -lt $source.Height; $y += 1) {
        for ($x = 0; $x -lt $source.Width; $x += 1) {
            $deltaX = $x - $centerX
            $deltaY = $y - $centerY
            if ($deltaX * $deltaX + $deltaY * $deltaY -le $radius * $radius) {
                $cleaned.SetPixel($x, $y, $source.GetPixel($x, $y))
            } else {
                $cleaned.SetPixel($x, $y, [System.Drawing.Color]::Transparent)
            }
        }
    }

    $temporaryPath = "$imagePath.cleaned.png"
    $cleaned.Save($temporaryPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $cleaned.Dispose()
    $source.Dispose()
    Move-Item -LiteralPath $temporaryPath -Destination $imagePath -Force
}

function Clear-LegacyControlArtwork {
    param(
        [Parameter(Mandatory = $true)] [string] $ImageName
    )

    # Construct still needs these sprite instances for touch hit-testing and
    # game events. Preserve each sheet's exact dimensions, but remove its old
    # pixels so it cannot flash through while the DOM overlay is hidden during
    # startup, loading transitions, or pause screens.
    $imagePath = Join-Path $projectRoot "docs/images/$ImageName"
    $source = [System.Drawing.Bitmap]::FromFile($imagePath)
    $transparent = New-Object System.Drawing.Bitmap(
        $source.Width,
        $source.Height,
        [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $source.Dispose()

    $graphics = [System.Drawing.Graphics]::FromImage($transparent)
    $graphics.Clear([System.Drawing.Color]::Transparent)
    $graphics.Dispose()

    $temporaryPath = "$imagePath.transparent.png"
    $transparent.Save($temporaryPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $transparent.Dispose()
    Move-Item -LiteralPath $temporaryPath -Destination $imagePath -Force
}

# These are the six individually approved button renders supplied by the user.
# Keeping their full-resolution sources in tools makes future builds reproduce
# the exact selected artwork instead of returning to the older proposal crops.
Export-ApprovedControl "attack-fist.png"
Export-ApprovedControl "attack-gun.png"
Export-ApprovedControl "interact-pickup.png"
Export-ApprovedControl "interact-trunk.png"
Export-ApprovedControl "reload-gun.png"
Export-ApprovedControl "switch-item.png"
Export-ApprovedControl "scope-lock.png"
Export-HudPlate
Clear-OutsideCircle "attack-fist.png"
Clear-OutsideCircle "attack-gun.png"
Clear-OutsideCircle "interact-pickup.png"
Clear-OutsideCircle "interact-trunk.png"
Clear-OutsideCircle "reload-gun.png"
Clear-OutsideCircle "switch-item.png"
Clear-OutsideCircle "scope-lock.png"
foreach ($legacyControlImage in $legacyControlImages) {
    Clear-LegacyControlArtwork $legacyControlImage
}

Get-ChildItem -LiteralPath $outputDirectory | Select-Object Name, Length
