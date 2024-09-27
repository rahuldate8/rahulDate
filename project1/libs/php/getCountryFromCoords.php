<?php
ini_set('display_errors', 'On');
error_reporting(E_ALL);

$executionStartTime = microtime(true);

if (isset($_GET['lat']) && isset($_GET['lng'])) {
    $lat = $_GET['lat'];
    $lng = $_GET['lng'];

    // Use Geonames API for reverse geocoding
    $url = "http://api.geonames.org/countryCodeJSON?lat=$lat&lng=$lng&username=rahuldate8";

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_URL, $url);

    $result = curl_exec($ch);
    curl_close($ch);

    $decode = json_decode($result, true);

    if (isset($decode['countryCode'])) {
        $output = array(
            'status' => array(
                'code' => 200,
                'name' => "ok",
                'description' => "success",
                'returnedIn' => intval((microtime(true) - $executionStartTime) * 1000) . " ms"
            ),
            'data' => array(
                'countryCode' => $decode['countryCode']
            )
        );
    } else {
        $output = array(
            'status' => array(
                'code' => 400,
                'name' => "error",
                'description' => "Country not found"
            )
        );
    }
} else {
    $output = array(
        'status' => array(
            'code' => 400,
            'name' => "error",
            'description' => "Latitude and longitude not provided"
        )
    );
}

header('Content-Type: application/json; charset=UTF-8');
echo json_encode($output);