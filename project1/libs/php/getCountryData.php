<?php
$countryCode = $_GET['country'];

// Load country borders
$geoJsonFile = '../data/countryBorders.geo.json';
$geoJsonData = json_decode(file_get_contents($geoJsonFile), true);

$borders = null;
foreach ($geoJsonData['features'] as $feature) {
    if ($feature['properties']['iso_a2'] === $countryCode) {
        $borders = $feature;
        break;
    }
}

// Get country info from RestCountries API
$restCountriesUrl = "https://restcountries.com/v3.1/alpha/{$countryCode}";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $restCountriesUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
curl_close($ch);

$countryInfo = json_decode($response, true)[0];

// Get weather data from OpenWeatherMap API
$capital = $countryInfo['capital'][0];
$weatherUrl = "http://api.openweathermap.org/data/2.5/weather?q={$capital}&units=metric&appid=YOUR_OPENWEATHERMAP_API_KEY";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $weatherUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
curl_close($ch);

$weatherData = json_decode($response, true);

$result = [
    'name' => $countryInfo['name']['common'],
    'capital' => $capital,
    'population' => $countryInfo['population'],
    'currency' => array_values($countryInfo['currencies'])[0]['name'],
    'borders' => $borders,
    'weather' => [
        'temperature' => $weatherData['main']['temp'],
        'description' => $weatherData['weather'][0]['description']
    ]
];

header('Content-Type: application/json');
echo json_encode($result);