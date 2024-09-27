<?php
ini_set('display_errors', 'On');
error_reporting(E_ALL);

$executionStartTime = microtime(true);

function callGeonamesAPI($url, $params) {
    $ch = curl_init();
    $url .= '?' . http_build_query($params);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_URL, $url);

    $result = curl_exec($ch);

    curl_close($ch);

    return json_decode($result, true);
}

if (isset($_GET['api'])) {
    $lat = $_GET['lat'];
    $lng = $_GET['lng'];
    $username = 'rahuldate8'; // Replace with your Geonames username

    $output = [];

    switch ($_GET['api']) {
        case 'nearbyPlace':
            $url = 'http://api.geonames.org/findNearbyPlaceNameJSON';
            $result = callGeonamesAPI($url, ['lat' => $lat, 'lng' => $lng, 'username' => $username]);
            $output = $result;
            break;
        case 'countryCode':
            $url = 'http://api.geonames.org/countryCodeJSON';
            $result = callGeonamesAPI($url, ['lat' => $lat, 'lng' => $lng, 'username' => $username]);
            $output = $result;
            break;
        case 'timezone':
            $url = 'http://api.geonames.org/timezoneJSON';
            $result = callGeonamesAPI($url, ['lat' => $lat, 'lng' => $lng, 'username' => $username]);
            $output = $result;
            break;
        case 'countrySubdivision':
            $url = 'http://api.geonames.org/countrySubdivisionJSON';
            $result = callGeonamesAPI($url, ['lat' => $lat, 'lng' => $lng, 'username' => $username, 'formatted' => 'true', 'style' => 'full']);
            $output = $result;
            break;
    }

    $output['executionTime'] = microtime(true) - $executionStartTime;

    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode($output);
}
?>