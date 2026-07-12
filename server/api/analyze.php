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
    echo json_encode(['error' => 'API not configured on server']);
    exit;
}

$config = require $configFile;
$apiKey = $config['gemini_api_key'] ?? '';

if (empty($apiKey)) {
    http_response_code(503);
    echo json_encode(['error' => 'Gemini API key not set on server']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$imageBase64 = $input['image'] ?? '';
$category = $input['category'] ?? '';

if (empty($imageBase64)) {
    http_response_code(400);
    echo json_encode(['error' => 'No image provided']);
    exit;
}

$prompt = "Ты эксперт по фотографии произведений искусства для онлайн-галереи Geo Gallery.
Проанализируй фото работы" . ($category ? " (категория: $category)" : "") . ".
Ответь СТРОГО в JSON без markdown:
{
  \"score\": число 1-10,
  \"ready\": true/false,
  \"issues\": [\"проблема1\"],
  \"tips\": [\"совет1\"],
  \"suggestedTitle\": \"название\",
  \"suggestedDescription\": \"описание\",
  \"detectedCategory\": \"painting|sculpture|photography|graphics|digital|ceramics|textile\"
}";

$payload = [
    'contents' => [[
        'parts' => [
            ['text' => $prompt],
            ['inline_data' => ['mime_type' => 'image/jpeg', 'data' => $imageBase64]],
        ],
    ]],
    'generationConfig' => ['temperature' => 0.3, 'maxOutputTokens' => 1024],
];

$url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' . urlencode($apiKey);

$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
    CURLOPT_POSTFIELDS => json_encode($payload),
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 30,
]);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode !== 200 || !$response) {
    http_response_code(502);
    echo json_encode(['error' => 'Gemini API request failed']);
    exit;
}

$data = json_decode($response, true);
$text = $data['candidates'][0]['content']['parts'][0]['text'] ?? '';
$text = preg_replace('/```json\s*/', '', $text);
$text = preg_replace('/```\s*/', '', $text);
$result = json_decode(trim($text), true);

if (!$result) {
    http_response_code(502);
    echo json_encode(['error' => 'Failed to parse AI response']);
    exit;
}

echo json_encode($result, JSON_UNESCAPED_UNICODE);
