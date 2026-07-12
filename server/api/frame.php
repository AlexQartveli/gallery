<?php

function gg_frame_width($w, $h) {
    return max(16, (int)round(min($w, $h) * 0.055));
}

function gg_mat_width($w, $h) {
    return max(6, (int)round(min($w, $h) * 0.015));
}

function gg_fit_dimensions($srcW, $srcH, $maxW, $maxH) {
    if ($srcW <= $maxW && $srcH <= $maxH) {
        return [$srcW, $srcH];
    }
    $scale = min($maxW / $srcW, $maxH / $srcH);
    return [(int)round($srcW * $scale), (int)round($srcH * $scale)];
}

function gg_paint_wood_rect($img, $x, $y, $w, $h, $vertical) {
    $colors = [
        imagecolorallocate($img, 42, 26, 16),
        imagecolorallocate($img, 139, 90, 60),
        imagecolorallocate($img, 166, 124, 82),
        imagecolorallocate($img, 122, 79, 53),
        imagecolorallocate($img, 61, 40, 23),
    ];

    $steps = $vertical ? $w : $h;
    for ($i = 0; $i < $steps; $i++) {
        $t = $steps > 1 ? $i / ($steps - 1) : 0;
        $idx = (int)round($t * (count($colors) - 1));
        $c = $colors[$idx];
        if ($vertical) {
            imageline($img, $x + $i, $y, $x + $i, $y + $h - 1, $c);
        } else {
            imageline($img, $x, $y + $i, $x + $w - 1, $y + $i, $c);
        }
    }

    $grain = imagecolorallocatealpha($img, 0, 0, 0, 100);
    $step = $vertical ? 8 : 6;
    for ($i = $y + 4; $i < $y + $h; $i += $step) {
        if ($vertical) {
            imageline($img, $x + 2, $i, $x + $w - 2, $i, $grain);
        } else {
            imageline($img, $x + 4, $i, $x + $w - 4, $i, $grain);
        }
    }
}

function gg_apply_wood_frame($artwork) {
    $imgW = imagesx($artwork);
    $imgH = imagesy($artwork);
    $mat = gg_mat_width($imgW, $imgH);
    $frame = gg_frame_width($imgW, $imgH);
    $pad = $frame + $mat;
    $totalW = $imgW + 2 * $pad;
    $totalH = $imgH + 2 * $pad;

    $out = imagecreatetruecolor($totalW, $totalH);

    gg_paint_wood_rect($out, 0, 0, $totalW, $frame, false);
    gg_paint_wood_rect($out, 0, $totalH - $frame, $totalW, $frame, false);
    gg_paint_wood_rect($out, 0, $frame, $frame, $totalH - 2 * $frame, true);
    gg_paint_wood_rect($out, $totalW - $frame, $frame, $frame, $totalH - 2 * $frame, true);

    $matColor = imagecolorallocate($out, 244, 239, 230);
    imagefilledrectangle($out, $frame, $frame, $totalW - $frame - 1, $totalH - $frame - 1, $matColor);

    $matBorder = imagecolorallocate($out, 200, 191, 176);
    imagerectangle($out, $pad - 1, $pad - 1, $totalW - $pad, $totalH - $pad, $matBorder);

    imagecopy($out, $artwork, $pad, $pad, 0, 0, $imgW, $imgH);
    imagedestroy($artwork);

    return $out;
}
