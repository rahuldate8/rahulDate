<?php
ini_set('display_errors', 'On');
error_reporting(E_ALL);

$executionStartTime = microtime(true);

// Get the country name from the request
$countryName = urlencode($_GET['country']);

// API Ninjas endpoint
$url = "https://api.api-ninjas.com/v1/airports?country=" . $countryName;

$ch = curl_init();
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_HTTPHEADER, array(
    'X-Api-Key: F1cCrpqnyaEEnjrsUSmR0Q==iKEdSU7F1GvN1EX8'
));

$result = curl_exec($ch);

$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

curl_close($ch);

$decode = json_decode($result, true);

$output = array(
    'status' => array(
        'code' => $httpCode,
        'name' => ($httpCode == 200) ? "ok" : "error",
        'description' => ($httpCode == 200) ? "success" : "API request failed",
        'returnedIn' => intval((microtime(true) - $executionStartTime) * 1000) . " ms"
    ),
    'data' => $decode
);

header('Content-Type: application/json; charset=UTF-8');

echo json_encode($output);