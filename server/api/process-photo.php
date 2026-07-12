<?php
require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/frame.php';

gg_json_headers();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$imageBase64 = isset($input['image']) ? $input['image'] : '';
$category = isset($input['category']) ? $input['category'] : 'painting';

if (empty($imageBase64)) {
    http_response_code(400);
    echo json_encode(['error' => 'No image provided']);
    exit;
}

$imageData = base64_decode($imageBase64);
if (!$imageData) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid image data']);
    exit;
}

$src = @imagecreatefromstring($imageData);
if (!$src) {
    http_response_code(400);
    echo json_encode(['error' => 'Cannot read image']);
    exit;
}

$srcW = imagesx($src);
$srcH = imagesy($src);
$maxW = 800;
$maxH = 1000;

$estFrame = gg_frame_width($maxW, $maxH);
$estMat = gg_mat_width($maxW, $maxH);
$pad = 2 * ($estFrame + $estMat);

list($dstW, $dstH) = gg_fit_dimensions($srcW, $srcH, $maxW - $pad, $maxH - $pad);

$artwork = imagecreatetruecolor($dstW, $dstH);
imagecopyresampled($artwork, $src, 0, 0, 0, 0, $dstW, $dstH, $srcW, $srcH);
imagedestroy($src);

if (function_exists('imagefilter')) {
    @imagefilter($artwork, IMG_FILTER_BRIGHTNESS, 5);
    @imagefilter($artwork, IMG_FILTER_CONTRAST, -5);
}

$dst = gg_apply_wood_frame($artwork);
$outW = imagesx($dst);
$outH = imagesy($dst);

ob_start();
imagejpeg($dst, null, 82);
$optimizedData = ob_get_clean();
imagedestroy($dst);

$optimizedBase64 = base64_encode($optimizedData);
$sizeKb = round(strlen($optimizedData) / 1024);

$result = [
    'image' => 'data:image/jpeg;base64,' . $optimizedBase64,
    'mime' => 'image/jpeg',
    'width' => $outW,
    'height' => $outH,
    'sizeKb' => $sizeKb,
    'score' => 7,
    'ready' => true,
    'issues' => [],
    'tips' => ['Фото сжато с сохранением пропорций и деревянной рамкой'],
    'seoTitle' => 'Авторская работа',
    'seoDescription' => 'Уникальное произведение искусства на Geo Gallery',
    'seoAlt' => 'Произведение искусства — Geo Gallery',
    'suggestedCategory' => $category,
];

echo json_encode($result, JSON_UNESCAPED_UNICODE);
