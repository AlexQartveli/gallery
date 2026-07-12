<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$configFile = __DIR__ . '/config.php';
if (!file_exists($configFile)) {
    http_response_code(503);
    echo json_encode(['error' => 'API not configured']);
    exit;
}

$config = require $configFile;
$apiKey = $config['gemini_api_key'] ?? '';

$input = json_decode(file_get_contents('php://input'), true);
$imageBase64 = $input['image'] ?? '';
$category = $input['category'] ?? 'painting';

if (empty($imageBase64)) {
    http_response_code(400);
    echo json_encode(['error' => 'No image provided']);
    exit;
}

// Decode image
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

// Standard SEO format: 800x1000 (4:5), center crop
$targetW = 800;
$targetH = 1000;
$targetRatio = $targetW / $targetH;
$srcRatio = $srcW / $srcH;

if ($srcRatio > $targetRatio) {
    $cropH = $srcH;
    $cropW = (int)($srcH * $targetRatio);
    $cropX = (int)(($srcW - $cropW) / 2);
    $cropY = 0;
} else {
    $cropW = $srcW;
    $cropH = (int)($srcW / $targetRatio);
    $cropX = 0;
    $cropY = (int)(($srcH - $cropH) / 2);
}

$dst = imagecreatetruecolor($targetW, $targetH);
imagecopyresampled($dst, $src, 0, 0, $cropX, $cropY, $targetW, $targetH, $cropW, $cropH);
imagedestroy($src);

// Auto-enhance: slight brightness/contrast
imagefilter($dst, IMG_FILTER_BRIGHTNESS, 5);
imagefilter($dst, IMG_FILTER_CONTRAST, -5);

// Output JPEG optimized
ob_start();
imagejpeg($dst, null, 82);
$optimizedData = ob_get_clean();
imagedestroy($dst);

$optimizedBase64 = base64_encode($optimizedData);
$sizeKb = round(strlen($optimizedData) / 1024);

// Default SEO response
$result = [
    'image' => 'data:image/jpeg;base64,' . $optimizedBase64,
    'mime' => 'image/jpeg',
    'width' => $targetW,
    'height' => $targetH,
    'sizeKb' => $sizeKb,
    'score' => 7,
    'ready' => true,
    'issues' => [],
    'tips' => ['Фото оптимизировано до стандарта Geo Gallery 800×1000'],
    'seoTitle' => 'Авторская работа',
    'seoDescription' => 'Уникальное произведение искусства на Geo Gallery',
    'seoAlt' => 'Произведение искусства — Geo Gallery',
    'suggestedCategory' => $category,
];

// Gemini SEO analysis if API key available
if (!empty($apiKey)) {
    $prompt = "Ты SEO-эксперт галереи искусства Geo Gallery. Проанализируй фото работы (категория: $category).
Ответь СТРОГО JSON без markdown:
{
  \"score\": 1-10,
  \"ready\": true/false,
  \"issues\": [\"проблема\"],
  \"tips\": [\"совет\"],
  \"seoTitle\": \"название до 60 символов\",
  \"seoDescription\": \"описание 120-160 символов для SEO\",
  \"seoAlt\": \"alt-текст для img до 125 символов\",
  \"suggestedCategory\": \"painting|sculpture|photography|graphics|digital|ceramics|textile\"
}";

    $payload = [
        'contents' => [[
            'parts' => [
                ['text' => $prompt],
                ['inline_data' => ['mime_type' => 'image/jpeg', 'data' => $optimizedBase64]],
            ],
        ]],
        'generationConfig' => ['temperature' => 0.2, 'maxOutputTokens' => 800],
    ];

    $url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' . urlencode($apiKey);
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_POSTFIELDS => json_encode($payload),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 25,
    ]);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode === 200 && $response) {
        $data = json_decode($response, true);
        $text = $data['candidates'][0]['content']['parts'][0]['text'] ?? '';
        $text = preg_replace('/```json\s*/', '', $text);
        $text = preg_replace('/```\s*/', '', $text);
        $text = trim($text);
        $gemini = json_decode($text, true);
        if ($gemini) {
            $result['score'] = $gemini['score'] ?? $result['score'];
            $result['ready'] = $gemini['ready'] ?? true;
            $result['issues'] = $gemini['issues'] ?? [];
            $result['tips'] = $gemini['tips'] ?? $result['tips'];
            $result['seoTitle'] = $gemini['seoTitle'] ?? $result['seoTitle'];
            $result['seoDescription'] = $gemini['seoDescription'] ?? $result['seoDescription'];
            $result['seoAlt'] = $gemini['seoAlt'] ?? $result['seoAlt'];
            $result['suggestedCategory'] = $gemini['suggestedCategory'] ?? $category;
        }
    }
}

echo json_encode($result, JSON_UNESCAPED_UNICODE);
