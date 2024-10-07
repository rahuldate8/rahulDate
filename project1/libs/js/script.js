let map, layerControl, currentCountryLayer;
let airportLayer;
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

    map.on('moveend', function() {
        let center = map.getCenter();
        globalLat = center.lat;
        globalLong = center.lng;
        console.log(`Map moved. New center: Lat ${globalLat}, Long ${globalLong}`);
    });

    layerControl = L.control.layers(basemaps).addTo(map);

    // Create a new marker cluster group for airports
    airportLayer = L.markerClusterGroup();

    // Add the airport layer to the layer control
    layerControl.addOverlay(airportLayer, "Airports");

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


    // L.easyButton("fa-newspaper fa-lg", showNewsModal, "News").addTo(map);
    L.easyButton("fa-newspaper fa-lg", function () {
        showNewsModal();
    }, "Latest News").addTo(map);
    
    // L.easyButton("fa-wikipedia-w fa-lg", showWikiModal, "Wikipedia").addTo(map);
    L.easyButton("fa-wikipedia-w fa-lg", function () {
        if (globalLat && globalLong) {
            showWikiModal(globalLat, globalLong);
        } else {
            alert("Location data not available. Please select a country first.");
        }
    }, "Wikipedia").addTo(map);

    // L.easyButton("fa-money-bill fa-lg", showCurrencyModal, "Currency").addTo(map);
    L.easyButton("fa-money-bill fa-lg", function () {
        showCurrencyModal();
    }, "Currency Converter").addTo(map);

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
        fetchCountryData(countryCode).then(updateGlobalCoordinates);
        fetchAirports(countryCode);
    }
}

function updateGlobalCoordinates(countryData) {
    if (countryData && countryData.latlng && countryData.latlng.length === 2) {
        globalLat = countryData.latlng[0];
        globalLong = countryData.latlng[1];
        console.log(`Updated coordinates: Lat ${globalLat}, Long ${globalLong}`);
    } else {
        console.error('Invalid country data for coordinate update');
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
    console.log(JSON.stringify(currentCountry));
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
    // alert(JSON.stringify(currentCountry));
    if (!currentCountry || !currentCountry.countryName) {
        alert("Please select a country first.");
        return;
    }
    
    const countryName = currentCountry.countryName;
    
    $('#newsModalBody').html('<div class="text-center"><div class="spinner-border" role="status"><span class="visually-hidden"></span></div></div>');
    $('#newsModal').modal('show');

    const today = new Date();
    const fromDate = new Date(today.setDate(today.getDate() - 30)).toISOString().split('T')[0]; // Get date 30 days ago

    $.ajax({
        url: 'libs/php/getNews.php',
        type: 'GET',
        dataType: 'json',
        data: { 
            country: countryName,
            from: fromDate
        }
    }).then(function(response) {
        if (response.status.name == "ok" && response.data.articles && response.data.articles.length > 0) {
            const article = response.data.articles[0]; // Get only the first article
            let newsHtml = `
                <div class="card">
                    <img src="${article.urlToImage || 'path/to/placeholder-image.jpg'}" class="card-img-top" alt="${article.title}">
                    <div class="card-body">
                        <h5 class="card-title">${article.title}</h5>
                        <h6 class="card-subtitle mb-2 text-muted">${article.source.name} - ${new Date(article.publishedAt).toLocaleDateString()}</h6>
                        <p class="card-text">${article.description}</p>
                        <a href="${article.url}" target="_blank" class="btn btn-primary">Read Full Article</a>
                    </div>
                </div>
            `;
            $('#newsModalBody').html(newsHtml);
        } else {
            throw new Error("No news available for this country.");
        }
    }).catch(function(error) {
        $('#newsModalBody').html(`<div class="alert alert-info" role="alert">${error.message}</div>`);
    });
}

function showWikiModal(lat, lng) {
    if (!lat || !lng) {
        alert("Latitude and longitude are required.");
        return;
    }    
    
    $('#wikiModalBody').html('<div class="text-center"><div class="spinner-border" role="status"><span class="visually-hidden"></span></div></div>');
    $('#wikiModal').modal('show');

    $.ajax({
        url: 'libs/php/getWikipedia.php',
        type: 'GET',
        dataType: 'json',
        data: { lat: lat, lng: lng }
    }).then(function(response) {
        if (response.status.name == "ok" && response.data.geonames && response.data.geonames.length > 0) {
            const entry = response.data.geonames[0];
            let wikiHtml = `
                <h3>${entry.title}</h3>
                <p>${entry.summary}</p>
                <p><strong>Distance:</strong> ${entry.distance} km</p>
                <p><strong>Population:</strong> ${entry.population || 'N/A'}</p>
                <a href="https://${entry.wikipediaUrl}" target="_blank" class="btn btn-primary">Read More on Wikipedia</a>
            `;
            $('#wikiModalBody').html(wikiHtml);
        } else {
            throw new Error("No Wikipedia data found for this location.");
        }
    }).catch(function(error) {
        $('#wikiModalBody').html(`<p class="text-danger">${error.message}</p>`);
    });
}



function showCurrencyModal() {
    if (!currentCountry || !currentCountry.currencyCode) {
        alert("Please select a country with a valid currency first.");
        return;
    }
    
    const countryCurrency = currentCountry.currencyCode;
    
    $('#currencyModalBody').html('<div class="text-center"><div class="spinner-border" role="status"><span class="visually-hidden"></span></div></div>');
    $('#currencyModal').modal('show');

    $.ajax({
        url: 'libs/php/getCurrencyRates.php',
        type: 'GET',
        dataType: 'json',
        data: { base: countryCurrency }
    }).then(function(response) {
        if (response.status.name == "ok") {
            const rates = response.data.conversion_rates;
            let currencyHtml = `
                <div class="container">
                    <div class="row justify-content-center">
                        <div class="col-md-8">
                            <div class="card">
                                <div class="card-body">
                                    <h5 class="card-title text-center mb-4">Currency Converter</h5>
                                    <div class="mb-3">
                                        <label for="fromAmount" class="form-label">Amount</label>
                                        <div class="input-group">
                                            <span class="input-group-text"><i class="fas fa-coins"></i></span>
                                            <input type="number" class="form-control" id="fromAmount" value="1" min="0" step="0.01">
                                        </div>
                                    </div>
                                    <div class="row">
                                        <div class="col-md-6 mb-3">
                                            <label for="fromCurrency" class="form-label">From Currency</label>
                                            <select class="form-select" id="fromCurrency">
                                                <option value="${countryCurrency}">${countryCurrency}</option>
                                                <option value="USD">USD</option>
                                                <option value="EUR">EUR</option>
                                                <option value="GBP">GBP</option>
                                            </select>
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label for="toCurrency" class="form-label">To Currency</label>
                                            <select class="form-select" id="toCurrency">
                                                ${Object.keys(rates).map(currency => `<option value="${currency}">${currency}</option>`).join('')}
                                            </select>
                                        </div>
                                    </div>
                                    <div class="d-grid gap-2" style="display: none;">
                                        <button id="convertCurrency" class="btn btn-primary" >Convert</button>
                                    </div>
                                    <div id="conversionResult" class="mt-3 text-center"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            $('#currencyModalBody').html(currencyHtml);
            
            $('#convertCurrency').on('click', function() {
                const amount = parseFloat($('#fromAmount').val());
                const fromCurrency = $('#fromCurrency').val();
                const toCurrency = $('#toCurrency').val();
                
                if (isNaN(amount) || amount <= 0) {
                    $('#conversionResult').html('<p class="text-danger">Please enter a valid amount.</p>');
                    return;
                }
                
                let result;
                if (fromCurrency === countryCurrency) {
                    result = amount * rates[toCurrency];
                } else if (toCurrency === countryCurrency) {
                    result = amount / rates[fromCurrency];
                } else {
                    const amountInBase = amount / rates[fromCurrency];
                    result = amountInBase * rates[toCurrency];
                }
                
                $('#conversionResult').html(`
                    <h4 class="mt-4">Conversion Result</h4>
                    <div class="alert alert-success" role="alert">
                        <strong>${amount.toFixed(2)} ${fromCurrency}</strong> = <strong>${result.toFixed(2)} ${toCurrency}</strong>
                    </div>
                    <p class="text-muted">Exchange rate: 1 ${fromCurrency} = ${(result / amount).toFixed(2)} ${toCurrency}</p>
                `);
            });

            // Add event listeners for real-time conversion
            $('#fromAmount, #fromCurrency, #toCurrency').on('input change', function() {
                $('#convertCurrency').click();
            });
        } else {
            throw new Error("Error fetching currency data: " + response.status.description);
        }
    }).catch(function(error) {
        $('#currencyModalBody').html(`<div class="alert alert-danger" role="alert">${error.message}</div>`);
    });
}

function closeModal() {
    $('.modal').modal('hide');
}

function loadDefaultCountry() {
    let defaultCountryCode = 'US';
    $('#countrySelect').val(defaultCountryCode).trigger('change');
}


function fetchAirports(countryName) {
    // Make the API call to fetch airports through our PHP file
    $.ajax({
        url: 'libs/php/getAirports.php',
        type: 'GET',
        dataType: 'json',
        data: {
            country: countryName
        },
        success: function(response) {
            console.log("Received response:", response);
            if (response && response.status && response.status.name == "ok") {
                addAirportMarkers(response.data);
            } else {
                console.error("Error in response:", response);
            }
        },
        error: function(jqXHR, textStatus, errorThrown) {
            console.error("AJAX error:", textStatus, errorThrown);
            console.log("Response text:", jqXHR.responseText);
        },
        complete: function() {
            console.log("AJAX request completed");
        }
    });
}

function addAirportMarkers(airports) {
    console.log("In addAirportMarkers");
    console.log(JSON.stringify(airports));
    // Clear existing markers
    airportLayer.clearLayers();

    airports.forEach(airport => {
        if (airport.latitude && airport.longitude) {
            let marker = L.marker([airport.latitude, airport.longitude], {
                icon: L.divIcon({
                    className: 'airport-icon',
                    html: '<i class="fas fa-plane"></i>',
                    iconSize: [20, 20]
                })
            });

            marker.bindPopup(`<b>${airport.name}</b><br>IATA: ${airport.iata}`);
            airportLayer.addLayer(marker);
        }
    });

    // Add the airport layer to the map if it's not already added
    if (!map.hasLayer(airportLayer)) {
        map.addLayer(airportLayer);
    }
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