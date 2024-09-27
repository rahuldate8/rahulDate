<?php
$lat = $_GET['lat'];
$lon = $_GET['lon'];

$url = "https://api.opencagedata.com/geocode/v1/json?q={$lat}+{$lon}&key=YOUR_OPENCAGE_API_KEY";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
curl_close($ch);

$data = json_decode($response, true);
$countryCode = $data['results'][0]['components']['country_code'];

header('Content-Type: application/json');
echo json_encode(['countryCode' => strtoupper($countryCode)]);