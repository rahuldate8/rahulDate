let preloaderTimeout;

function hidePreloader() {
    clearTimeout(preloaderTimeout);
    document.getElementById('preloader').classList.add('hidden');
    preloaderTimeout = setTimeout(() => {
        $('#preloader').fadeOut('slow');
    }, 500); 
}

function showPreloader() {
    clearTimeout(preloaderTimeout);
    const preloader = document.getElementById('preloader');
    preloader.style.display = 'flex';
    preloader.classList.remove('hidden');
}

let currentCountry = null;
let currentCountryCode = null;

let globalLat = null;
let globalLong = null;


let map, layerControl, currentCountryLayer;


const basemaps = {
    "Streets": L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}", {
        attribution: "Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012"
    }),
    "Satellite": L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
        attribution: "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
    })
};



// function initMap() {
//     map = L.map("map", {
//         layers: [basemaps.Streets]
//     }).setView([0, 0], 2);

//     layerControl = L.control.layers(basemaps).addTo(map);

//     if (L.easyButton) {
//         L.easyButton("fa-info fa-lg", function () {
//             $("#exampleModal").modal("show");
//         }, "Country Information").addTo(map);
//     } else {
//         console.warn("L.easyButton is not available. Make sure the plugin is loaded correctly.");
//     }
// }

function initMap() {
    map = L.map("map", {
        layers: [basemaps.Streets]
    }).setView([0, 0], 2);

    layerControl = L.control.layers(basemaps).addTo(map);

    L.easyButton("fa-info fa-lg", function () {
        $("#exampleModal").modal("show");
    }, "Country Information").addTo(map);

    L.easyButton("fa-cloud fa-lg", function () {
        $("#weatherModal").modal("show");
    }, "Weather Information").addTo(map);

    L.easyButton("fa-newspaper fa-lg", function () {
        $("#newsModal").modal("show");
    }, "News").addTo(map);

    L.easyButton("fa-wikipedia-w fa-lg", function () {
        $("#wikiModal").modal("show");
    }, "Wikipedia").addTo(map);

    L.easyButton("fa-money-bill fa-lg", function () {
        $("#currencyModal").modal("show");
    }, "Wikipedia").addTo(map);

    // Add this line to make the map responsive
    $(window).on("resize", function() {
        map.invalidateSize();
    });
}

// function loadCountryList() {
//     $.ajax({
//         url: 'libs/php/getCountryList.php',
//         type: 'GET',
//         dataType: 'json',
//         success: function(response) {
//             if (response.status.name == "ok") {
//                 let select = $('#countrySelect');
//                 select.empty(); // Clear existing options
//                 select.append($('<option></option>').attr('value', '').text('Select a country')); // Add default option
//                 $.each(response.data, function(code, name) {
//                     select.append($('<option></option>').attr('value', code).text(name));
//                 });
//             } else {
//                 console.error("Error loading country list:", response.status.description);
//             }
//         },
//         error: function(jqXHR, textStatus, errorThrown) {
//             console.error("Error loading country list:", textStatus, errorThrown);
//         }
//     });
// }

function loadCountryList() {
    return new Promise((resolve, reject) => {
        $.ajax({
            url: 'libs/php/getCountryList.php',
            type: 'GET',
            dataType: 'json',
            success: function(response) {
                if (response.status.name == "ok") {
                    let select = $('#countrySelect');
                    select.empty();
                    select.append($('<option></option>').attr('value', '').text('Select a country'));
                    $.each(response.data, function(code, name) {
                        select.append($('<option></option>').attr('value', code).text(name));
                    });
                    resolve();
                } else {
                    reject("Error loading country list: " + response.status.description);
                }
            },
            error: function(jqXHR, textStatus, errorThrown) {
                reject("Error loading country list: " + textStatus);
            }
        });
    });
}

// function getUserLocation() {    
//     if ("geolocation" in navigator) {
//         navigator.geolocation.getCurrentPosition(function(position) {
//             let lat = position.coords.latitude;
//             let lng = position.coords.longitude;
//             reverseGeocode(lat, lng);
//         }, function(error) {
//             console.error("Error getting user location:", error);
//         });
//     } else {
//         console.log("Geolocation is not supported by this browser.");
//     }
// }

// function getUserLocation() {
//     return new Promise((resolve, reject) => {
//         if ("geolocation" in navigator) {
//             navigator.geolocation.getCurrentPosition(function(position) {
//                 let lat = position.coords.latitude;
//                 globalLat = lat;
//                 let lng = position.coords.longitude;
//                 globalLong = lng;
//                 console.log("lat: "+lat+", Longitude: "+lng);
//                 reverseGeocode(lat, lng).then(resolve).catch(reject);
//             }, function(error) {
//                 console.error("Error getting user location:", error);
//                 loadDefaultCountry().then(resolve).catch(reject);
//             });
//         } else {
//             console.log("Geolocation is not supported by this browser.");
//             loadDefaultCountry().then(resolve).catch(reject);
//         }
//     });
// }


function reverseGeocode(lat, lng) {
    $.ajax({
        url: 'libs/php/getCountryFromCoords.php',
        type: 'GET',
        dataType: 'json',
        data: {
            lat: lat,
            lng: lng
        },
        success: function(response) {
            if (response.status.name == "ok") {
                let countryCode = response.data.countryCode;
                $('#countrySelect').val(countryCode).trigger('change');
            } else {
                console.error("Error in reverse geocoding:", response.status.description);
                loadDefaultCountry();
            }
        },
        error: function(jqXHR, textStatus, errorThrown) {
            console.error("Error in reverse geocoding:", textStatus, errorThrown);
            loadDefaultCountry();
        }
    });
}

// function onCountryChange() {
//     const countryCode = $(this).val();
//     if (countryCode) {
//         fetchCountryData(countryCode);
//     }
// }

function onCountryChange() {
    const countryCode = $(this).val();
    if (countryCode) {
        currentCountryCode = countryCode;
        fetchCountryData(countryCode);
    }
}

function fetchCountryData(countryCode) {
    $.ajax({
        url: 'libs/php/getCountryInfo.php',
        type: 'GET',
        data: { country: countryCode },
        dataType: 'json',
        success: function(response) {
            if (response.status.name === "ok") {
                updateMap(response.data);
                updateModal(response.data);
            }
        },
        error: function(jqXHR, textStatus, errorThrown) {
            console.error("Error fetching country data:", textStatus, errorThrown);
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

function showWeatherModal() {
    if (!currentCountry) {
        alert("Please select a country first.");
        return;
    }
    
    $.ajax({
        url: 'libs/php/getWeather.php',
        type: 'GET',
        dataType: 'json',
        data: {
            lat: currentCountry.latlng[0],
            lng: currentCountry.latlng[1]
        },
        success: function(response) {
            if (response.status.name == "ok") {
                let weatherHtml = `
                    <h3>Current Weather</h3>
                    <p>Temperature: ${response.data.current.temp}°C</p>
                    <p>Conditions: ${response.data.current.weather[0].description}</p>
                    <h3>Forecast</h3>
                    <ul>
                `;
                response.data.daily.slice(1, 4).forEach(day => {
                    weatherHtml += `<li>${new Date(day.dt * 1000).toLocaleDateString()}: ${day.temp.day}°C, ${day.weather[0].description}</li>`;
                });
                weatherHtml += '</ul>';
                $('#weatherModalBody').html(weatherHtml);
                $('#weatherModal').modal('show');
            }
        },
        error: function(jqXHR, textStatus, errorThrown) {
            console.error("Error fetching weather data:", textStatus, errorThrown);
        }
    });
}

function showNewsModal() {
    if (!currentCountry) {
        alert("Please select a country first.");
        return;
    }
    
    $.ajax({
        url: 'libs/php/getNews.php',
        type: 'GET',
        dataType: 'json',
        data: {
            country: currentCountryCode
        },
        success: function(response) {
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
                $('#newsModal').modal('show');
            }
        },
        error: function(jqXHR, textStatus, errorThrown) {
            console.error("Error fetching news data:", textStatus, errorThrown);
        }
    });
}

function showWikiModal() {
    if (!currentCountry) {
        alert("Please select a country first.");
        return;
    }
    
    $.ajax({
        url: 'libs/php/getWikipedia.php',
        type: 'GET',
        dataType: 'json',
        data: {
            country: currentCountry.name
        },
        success: function(response) {
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
                $('#wikiModal').modal('show');
            }
        },
        error: function(jqXHR, textStatus, errorThrown) {
            console.error("Error fetching Wikipedia data:", textStatus, errorThrown);
        }
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
        
        $.ajax({
            url: 'libs/php/convertCurrency.php',
            type: 'GET',
            dataType: 'json',
            data: {
                amount: amount,
                from: from,
                to: to
            },
            success: function(response) {
                if (response.status.name == "ok") {
                    $('#conversionResult').html(`${amount} ${from} = ${response.data.result} ${to}`);
                }
            },
            error: function(jqXHR, textStatus, errorThrown) {
                console.error("Error converting currency:", textStatus, errorThrown);
            }
        });
    });
}

// function closeModal() {
//     $('#exampleModal').modal('hide');    
// }

function closeModal() {
    $('#exampleModal').modal('hide');
}

function getUserLocation() {
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(function(position) {
            let lat = position.coords.latitude;
            globalLat = lat;
            alert(globalLat);
            let lng = position.coords.longitude;
            globalLong = lng;
            alert(globalLong);
            reverseGeocode(lat, lng);
        }, function(error) {
            console.error("Error getting user location:", error);
            loadDefaultCountry(); // Load a default country if geolocation fails
        });
    } else {
        console.log("Geolocation is not supported by this browser.");
        loadDefaultCountry(); // Load a default country if geolocation is not supported
    }
}

function loadDefaultCountry() {
    let defaultCountryCode = 'US';
    $('#countrySelect').val(defaultCountryCode).trigger('change');
}


$(window).on('resize', function() {
    if (map) map.invalidateSize();
});

$(window).on('load', function() {
    // Hide the preloader
    $('#preloader').fadeOut('slow', function() {
        $(this).remove();
    });
});

// $(document).ready(function() {    
//     initMap();    
//     // loadCountryList();
//     loadCountryList().then(() => {
//         getUserLocation();
//     });
//     // getUserLocation();

//     $('#countrySelect').change(onCountryChange);
    
//     $('#closeModalBtn').on('click', closeModal);
//     // $('#closeModalBtn').on('click', function() {
//     //     closeModal();
//     // });
//     $(document).on('click', '.modal-backdrop', closeModal);

// });

// function fetchWeatherData(lat, lng) {
//     alert("fetchWeatherData");
//     return $.ajax({
//         url: 'libs/php/getWeather.php',
//         type: 'GET',
//         dataType: 'json',
//         data: {
//             lat: lat,
//             lng: lng
//         }
//     });
// }

function fetchWeatherData(lat, lng) {    
    alert(lat);
    alert(lng);
    $.ajax({
        url: "libs/php/getWeather.php",
        type: 'POST',
        dataType: 'json',
        data: {
            lat: lat,
            lng: lng
        },
        success: function(result) {
            console.log(JSON.stringify(result));

            if (result.status.name == "ok") {
                updateWeatherModal(result.data);
                // $('#weatherModal').modal('show');
            } else {
                console.error("Error fetching weather data:", result.status.description);
            }
        },
        error: function(jqXHR, textStatus, errorThrown) {
            console.log(JSON.stringify(jqXHR));
            console.log(JSON.stringify(textStatus));
            console.log(JSON.stringify(errorThrown));
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
        $('#weatherModalBody').html(weatherHtml);
    } else {
        $('#weatherModalBody').html('<p>Weather data not available.</p>');
    }
}

// $(document).ready(function() {
//     showPreloader(); // Ensure preloader is shown
//     initMap();
//     loadCountryList()
//         .then(() => getUserLocation())
//         .catch(error => console.error("Error in initialization:", error))
//         .finally(() => {
//             hidePreloader();
//         });

//     $('#countrySelect').change(onCountryChange);
//     $('#closeModalBtn').on('click', closeModal);
//     $(document).on('click', '.modal-backdrop', closeModal);
// });

// $(document).ready(function() {
//     initMap();
//     loadCountryList().then(() => {
//         return getUserLocation();
//     }).then(() => {
//         // At this point, globalLat and globalLong should be set,
//         // and reverseGeocode has already been called in getUserLocation
//         // So we can directly fetch weather data
//         return fetchWeatherData(globalLat, globalLong);
//     }).then((weatherResponse) => {
//         if (weatherResponse.status.name === "ok") {
//             updateWeatherModal(weatherResponse.data);
//         } else {
//             console.error("Error fetching weather data:", weatherResponse.status.description);
//         }
//     }).catch((error) => {
//         console.error("Error in initialization:", error);
//         loadDefaultCountry();
//     });

//     $('#countrySelect').change(onCountryChange);
//     $('#closeModalBtn').on('click', closeModal);
//     $(document).on('click', '.modal-backdrop', closeModal);
// });

$(document).ready(function() {
    initMap();
    loadCountryList().then(() => {
        return getUserLocation();
    }).then(() => {
        // At this point, globalLat and globalLong should be set
        // and reverseGeocode has already been called in getUserLocation
        // So we can directly fetch weather data
        if (typeof globalLat !== 'undefined' && typeof globalLong !== 'undefined') {
            return fetchWeatherData(globalLat, globalLong);
        } else {
            throw new Error("Location not available");
        }
    }).then(() => {
        console.log("Weather data fetched successfully");
    }).catch((error) => {
        console.error("Error in initialization or fetching weather:", error);
        loadDefaultCountry();
    });

    $('#countrySelect').change(onCountryChange);
    $('#closeModalBtn').on('click', closeModal);
    $(document).on('click', '.modal-backdrop', closeModal);

    // Weather button event listener (if you still want to keep it)
    $('#weatherBtn').on('click', function() {
        fetchWeatherData(globalLat, globalLong);
    });
});