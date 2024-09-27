<?php
ini_set('display_errors', 'On');
error_reporting(E_ALL);

$executionStartTime = microtime(true);

// Read the countryBorders.geo.json file
$countryData = json_decode(file_get_contents("../../data/countryBorders.geo.json"), true);

$output = [];

// Extract country codes and names
foreach ($countryData['features'] as $feature) {
    $output[$feature['properties']['iso_a2']] = $feature['properties']['name'];
}

// Sort countries alphabetically by name
asort($output);

$response = [
    'status' => [
        'code' => 200,
        'name' => "ok",
        'description' => "success",
        'returnedIn' => intval((microtime(true) - $executionStartTime) * 1000) . " ms"
    ],
    'data' => $output
];

header('Content-Type: application/json; charset=UTF-8');
echo json_encode($response);