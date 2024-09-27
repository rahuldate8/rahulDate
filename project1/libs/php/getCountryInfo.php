<?php
// In libs/php/getCountryInfo.php

ini_set('display_errors', 'On');
error_reporting(E_ALL);

$executionStartTime = microtime(true);

// Check if country code is provided
if (isset($_GET['country'])) {
    $countryCode = $_GET['country'];
    
    // Geonames API call
    $geonamesURL = "http://api.geonames.org/countryInfoJSON?formatted=true&lang=en&country={$countryCode}&username=rahuldate8&style=full";
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_URL, $geonamesURL);

    $result = curl_exec($ch);
    curl_close($ch);

    $geonamesData = json_decode($result, true);

    if (isset($geonamesData['geonames']) && !empty($geonamesData['geonames'])) {
        $countryData = $geonamesData['geonames'][0];

        // Get country borders
        $countryBorders = json_decode(file_get_contents("../../data/countryBorders.geo.json"), true);
        $borders = null;
        foreach ($countryBorders['features'] as $feature) {
            if ($feature['properties']['iso_a2'] === $countryCode) {
                $borders = $feature['geometry'];
                break;
            }
        }

        $output = [
            'status' => [
                'code' => 200,
                'name' => "ok",
                'description' => "success",
                'returnedIn' => intval((microtime(true) - $executionStartTime) * 1000) . " ms"
            ],
            'data' => [
                'countryName' => $countryData['countryName'],
                'capital' => $countryData['capital'],
                'population' => intval($countryData['population']),
                'areaInSqKm' => floatval($countryData['areaInSqKm']),
                'continentName' => $countryData['continentName'],
                'currencyCode' => $countryData['currencyCode'],
                'languages' => $countryData['languages'],
                'borders' => $borders
            ]
        ];
    } else {
        $output = [
            'status' => [
                'code' => 400,
                'name' => "error",
                'description' => "Country data not found"
            ]
        ];
    }
    
    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode($output);
} else {
    // Handle error if no country code is provided
    echo json_encode([
        'status' => [
            'code' => 400,
            'name' => "error",
            'description' => "Country code not provided"
        ]
    ]);
}