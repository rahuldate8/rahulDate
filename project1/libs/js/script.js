let map, layerControl, currentCountryLayer;


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

    if (L.easyButton) {
        L.easyButton("fa-info fa-lg", function () {
            $("#exampleModal").modal("show");
        }, "Country Information").addTo(map);
    } else {
        console.warn("L.easyButton is not available. Make sure the plugin is loaded correctly.");
    }
}

function loadCountryList() {
    $.ajax({
        url: 'libs/php/getCountryList.php',
        type: 'GET',
        dataType: 'json',
        success: function(response) {
            if (response.status.name == "ok") {
                let select = $('#countrySelect');
                select.empty(); // Clear existing options
                select.append($('<option></option>').attr('value', '').text('Select a country')); // Add default option
                $.each(response.data, function(code, name) {
                    select.append($('<option></option>').attr('value', code).text(name));
                });
            } else {
                console.error("Error loading country list:", response.status.description);
            }
        },
        error: function(jqXHR, textStatus, errorThrown) {
            console.error("Error loading country list:", textStatus, errorThrown);
        }
    });
}

function getUserLocation() {    
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(function(position) {
            let lat = position.coords.latitude;
            let lng = position.coords.longitude;
            reverseGeocode(lat, lng);
        }, function(error) {
            console.error("Error getting user location:", error);
        });
    } else {
        console.log("Geolocation is not supported by this browser.");
    }
}


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

function onCountryChange() {
    const countryCode = $(this).val();
    if (countryCode) {
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

function closeModal() {
    $('#exampleModal').modal('hide');    
}

function getUserLocation() {
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(function(position) {
            let lat = position.coords.latitude;
            let lng = position.coords.longitude;
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

$(document).ready(function() {    
    initMap();    
    loadCountryList(); // Call this function to load the country list
    getUserLocation();

    $('#countrySelect').change(onCountryChange);
    

    $('#closeModalBtn').on('click', function() {
        closeModal();
    });
});

$(window).on('resize', function() {
    if (map) map.invalidateSize();
});