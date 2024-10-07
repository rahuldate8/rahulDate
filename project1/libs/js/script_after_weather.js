let map, layerControl, currentCountryLayer;
let currentCountry = null;
let currentCountryCode = null;
let globalLat = null;
let globalLong = null;

const basemaps = {
    "Streets": L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}", {
        attribution: "Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012"
    }),
    "Satellite": L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
        attribution: "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
    })
};

function initMap() {
    map = L.map("map", {
        layers: [basemaps.Streets]
    }).setView([0, 0], 2);

    layerControl = L.control.layers(basemaps).addTo(map);

    L.easyButton("fa-info fa-lg", function () {
        $("#exampleModal").modal("show");
    }, "Country Information").addTo(map);

    L.easyButton("fa-cloud fa-lg", function () {
        if (globalLat && globalLong) {
            fetchWeatherData(globalLat, globalLong);
        } else {
            alert("Location data not available. Please select a country first.");
        }
    }, "Weather Information").addTo(map);

    L.easyButton("fa-newspaper fa-lg", showNewsModal, "News").addTo(map);
    L.easyButton("fa-wikipedia-w fa-lg", showWikiModal, "Wikipedia").addTo(map);
    L.easyButton("fa-money-bill fa-lg", showCurrencyModal, "Currency").addTo(map);

    $(window).on("resize", function() {
        map.invalidateSize();
    });
}

function loadCountryList() {
    return $.ajax({
        url: 'libs/php/getCountryList.php',
        type: 'GET',
        dataType: 'json'
    }).then(function(response) {
        if (response.status.name == "ok") {
            let select = $('#countrySelect');
            select.empty();
            select.append($('<option></option>').attr('value', '').text('Select a country'));
            $.each(response.data, function(code, name) {
                select.append($('<option></option>').attr('value', code).text(name));
            });
        } else {
            throw new Error("Error loading country list: " + response.status.description);
        }
    });
}

function getUserLocation() {
    return new Promise((resolve, reject) => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(function(position) {
                globalLat = position.coords.latitude;
                globalLong = position.coords.longitude;
                resolve({ lat: globalLat, lng: globalLong });
            }, function(error) {
                console.error("Error getting user location:", error);
                reject(error);
            });
        } else {
            reject(new Error("Geolocation is not supported by this browser."));
        }
    });
}

function reverseGeocode(lat, lng) {
    return $.ajax({
        url: 'libs/php/getCountryFromCoords.php',
        type: 'GET',
        dataType: 'json',
        data: { lat: lat, lng: lng }
    }).then(function(response) {
        if (response.status.name == "ok") {
            let countryCode = response.data.countryCode;
            $('#countrySelect').val(countryCode).trigger('change');
        } else {
            throw new Error("Error in reverse geocoding: " + response.status.description);
        }
    });
}

function onCountryChange() {
    const countryCode = $(this).val();
    if (countryCode) {
        currentCountryCode = countryCode;
        fetchCountryData(countryCode);
    }
}

function fetchCountryData(countryCode) {
    return $.ajax({
        url: 'libs/php/getCountryInfo.php',
        type: 'GET',
        data: { country: countryCode },
        dataType: 'json'
    }).then(function(response) {
        if (response.status.name === "ok") {
            updateMap(response.data);
            updateModal(response.data);
        } else {
            throw new Error("Error fetching country data: " + response.status.description);
        }
    });
}

function updateMap(countryData) {
    if (currentCountryLayer) {
        map.removeLayer(currentCountryLayer);
    }
    currentCountryLayer = L.geoJSON(countryData.borders).addTo(map);
    map.fitBounds(currentCountryLayer.getBounds());
}

function updateModal(countryData) {
    currentCountry = countryData;
    let tableContent = '';
    const iconMap = {
        'countryName': 'fa-flag',
        'capital': 'fa-landmark',
        'population': 'fa-users',
        'areaInSqKm': 'fa-map',
        'continentName': 'fa-globe',
        'currencyCode': 'fa-money-bill',
        'languages': 'fa-language'
    };

    for (let [key, value] of Object.entries(countryData)) {
        if (key !== 'borders') {
            const icon = iconMap[key] || 'fa-info';
            let displayValue = value;
            if (key === 'population') {
                displayValue = value.toLocaleString();
            } else if (key === 'areaInSqKm') {
                displayValue = value.toLocaleString() + ' km²';
            }
            tableContent += `
                <tr>
                    <td class="text-center">
                        <i class="fa-solid ${icon} fa-xl text-success"></i>
                    </td>
                    <td>${key.charAt(0).toUpperCase() + key.slice(1)}</td>
                    <td class="text-end">${displayValue}</td>
                </tr>
            `;
        }
    }

    $('#countryInfoTable').html(tableContent);
    $('#exampleModal').modal('show');
}

function fetchWeatherData(lat, lng) {
    $('#weatherModalBody').html('<div class="text-center"><div class="spinner-border" role="status"><span class="visually-hidden"></span></div></div>');
    $('#weatherModal').modal('show');

    return $.ajax({
        url: "libs/php/getWeather.php",
        type: 'POST',
        dataType: 'json',
        data: { lat: lat, lng: lng }
    }).then(function(result) {
        if (result.status.name == "ok") {
            updateWeatherModal(result.data);
        } else {
            throw new Error("Error fetching weather data: " + result.status.description);
        }
    });
}

function updateWeatherModal(weatherData) {
    if (weatherData && weatherData.weatherObservation) {
        const observation = weatherData.weatherObservation;
        let weatherInfo = `
            <table class="table">
                <tr>
                    <td>Temperature</td>
                    <td>${observation.temperature}°C</td>
                </tr>
                <tr>
                    <td>Humidity</td>
                    <td>${observation.humidity}%</td>
                </tr>
                <tr>
                    <td>Wind Speed</td>
                    <td>${observation.windSpeed} m/s</td>
                </tr>
                <tr>
                    <td>Clouds</td>
                    <td>${observation.clouds}</td>
                </tr>
                <tr>
                    <td>Weather Condition</td>
                    <td>${observation.weatherCondition}</td>
                </tr>
                <tr>
                    <td>Observation Time</td>
                    <td>${observation.datetime}</td>
                </tr>
            </table>
        `;
        $('#weatherModalBody').html(weatherInfo);
    } else {
        $('#weatherModalBody').html('<p>Weather data not available.</p>');
    }
}

function showNewsModal() {
    if (!currentCountry) {
        alert("Please select a country first.");
        return;
    }
    
    $('#newsModalBody').html('<div class="text-center"><div class="spinner-border" role="status"><span class="visually-hidden"></span></div></div>');
    $('#newsModal').modal('show');

    $.ajax({
        url: 'libs/php/getNews.php',
        type: 'GET',
        dataType: 'json',
        data: { country: currentCountryCode }
    }).then(function(response) {
        if (response.status.name == "ok") {
            let newsHtml = '<div class="row">';
            response.data.articles.slice(0, 6).forEach(article => {
                newsHtml += `
                    <div class="col-md-4 mb-3">
                        <div class="card">
                            <img src="${article.urlToImage}" class="card-img-top" alt="${article.title}">
                            <div class="card-body">
                                <h5 class="card-title">${article.title}</h5>
                                <p class="card-text">${article.source.name}</p>
                                <a href="${article.url}" target="_blank" class="btn btn-primary">Read More</a>
                            </div>
                        </div>
                    </div>
                `;
            });
            newsHtml += '</div>';
            $('#newsModalBody').html(newsHtml);
        } else {
            throw new Error("Error fetching news data: " + response.status.description);
        }
    }).catch(function(error) {
        $('#newsModalBody').html(`<p class="text-danger">${error.message}</p>`);
    });
}

function showWikiModal() {
    if (!currentCountry) {
        alert("Please select a country first.");
        return;
    }
    
    $('#wikiModalBody').html('<div class="text-center"><div class="spinner-border" role="status"><span class="visually-hidden"></span></div></div>');
    $('#wikiModal').modal('show');

    $.ajax({
        url: 'libs/php/getWikipedia.php',
        type: 'GET',
        dataType: 'json',
        data: { country: currentCountry.name }
    }).then(function(response) {
        if (response.status.name == "ok") {
            let wikiHtml = '<ul class="list-group">';
            response.data.geonames.forEach(entry => {
                wikiHtml += `
                    <li class="list-group-item">
                        <h5>${entry.title}</h5>
                        <p>${entry.summary}</p>
                        <a href="https://${entry.wikipediaUrl}" target="_blank" class="btn btn-sm btn-primary">Read More</a>
                    </li>
                `;
            });
            wikiHtml += '</ul>';
            $('#wikiModalBody').html(wikiHtml);
        } else {
            throw new Error("Error fetching Wikipedia data: " + response.status.description);
        }
    }).catch(function(error) {
        $('#wikiModalBody').html(`<p class="text-danger">${error.message}</p>`);
    });
}

function showCurrencyModal() {
    if (!currentCountry) {
        alert("Please select a country first.");
        return;
    }
    
    let currencyHtml = `
        <div class="mb-3">
            <label for="fromAmount" class="form-label">Amount</label>
            <input type="number" class="form-control" id="fromAmount" value="1">
        </div>
        <div class="mb-3">
            <label for="fromCurrency" class="form-label">From Currency</label>
            <select class="form-select" id="fromCurrency">
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
            </select>
        </div>
        <div class="mb-3">
            <label for="toCurrency" class="form-label">To Currency</label>
            <select class="form-select" id="toCurrency">
                <option value="${currentCountry.currencies[0].code}">${currentCountry.currencies[0].code}</option>
            </select>
        </div>
        <div class="mb-3">
            <button id="convertCurrency" class="btn btn-primary">Convert</button>
        </div>
        <div id="conversionResult"></div>
    `;
    
    $('#currencyModalBody').html(currencyHtml);
    $('#currencyModal').modal('show');
    
    $('#convertCurrency').on('click', function() {
        const amount = $('#fromAmount').val();
        const from = $('#fromCurrency').val();
        const to = $('#toCurrency').val();
        
        $('#conversionResult').html('<div class="text-center"><div class="spinner-border" role="status"><span class="visually-hidden"></span></div></div>');

        $.ajax({
            url: 'libs/php/convertCurrency.php',
            type: 'GET',
            dataType: 'json',
            data: { amount: amount, from: from, to: to }
        }).then(function(response) {
            if (response.status.name == "ok") {
                $('#conversionResult').html(`${amount} ${from} = ${response.data.result} ${to}`);
            } else {
                throw new Error("Error converting currency: " + response.status.description);
            }
        }).catch(function(error) {
            $('#conversionResult').html(`<p class="text-danger">${error.message}</p>`);
        });
    });
}

function closeModal() {
    $('.modal').modal('hide');
}

function loadDefaultCountry() {
    let defaultCountryCode = 'US';
    $('#countrySelect').val(defaultCountryCode).trigger('change');
}

$(document).ready(function() {
    initMap();

    Promise.all([loadCountryList(), getUserLocation()])
        .then(([_, location]) => reverseGeocode(location.lat, location.lng))
        .catch(error => {
            console.error("Error in initialization:", error);
            loadDefaultCountry();
        });

    $('#countrySelect').change(onCountryChange);
    $('#closeModalBtn').on('click', closeModal);
    $(document).on('click', '.modal-backdrop', closeModal);
});

$(window).on('load', function() {
    $('#preloader').fadeOut('slow', function() {
        $(this).remove();
    });
});