$(window).on('load', function () {
    if ($('#preloader').length) {
        $('#preloader').delay(1000).fadeOut('slow', function () {
            $(this).remove();
        });
    }
});

$(document).ready(function() {
    var fieldsToDisplay = {
        'nearbyPlace': ['name', 'countryName', 'population', 'lat', 'lng'],
        'countryCode': ['countryCode', 'countryName', 'languages'],
        'timezone': ['timezoneId', 'time', 'gmtOffset', 'sunrise', 'sunset'],
        'countrySubdivision': ['countryName', 'adminName1', 'adminCode1']
    };

    function displayResults(api, data) {
        $('#resultTitle').text(changeCamelCase(api) + ' Results');
        var $tbody = $('#resultTable tbody').empty();
        
        var fields = fieldsToDisplay[api] || [];
        
        if (api === 'nearbyPlace' && data.geonames && data.geonames.length > 0) {
            var place = data.geonames[0];
            fields.forEach(function(field) {
                var value = place[field];
                if (value !== undefined) {                    
                    // const result = field.replace(/([A-Z])/g, " $1");
                    // const finalResult = result.charAt(0).toUpperCase() + result.slice(1);
                    $tbody.append(`<tr><td>${changeCamelCase(field)}</td><td>${value}</td></tr>`);
                }
            });
        } else if (api === 'countrySubdivision') {
            fields.forEach(function(field) {
                var value;
                if (field === 'adminCode1') {
                    value = data.codes && data.codes.length > 0 ? data.codes[0].code : 'N/A';
                } else {
                    value = data[field];
                }
                if (value !== undefined) {
                    // const result = field.replace(/([A-Z])/g, " $1");
                    // const finalResult = result.charAt(0).toUpperCase() + result.slice(1);
                    $tbody.append(`<tr><td>${changeCamelCase(field)}</td><td>${value}</td></tr>`);
                }
            });
        } else {
            fields.forEach(function(field) {
                var value = data[field];
                if (value !== undefined) {
                    // const result = field.replace(/([A-Z])/g, " $1");
                    // const finalResult = result.charAt(0).toUpperCase() + result.slice(1);
                    $tbody.append(`<tr><td>${changeCamelCase(field)}</td><td>${value}</td></tr>`);
                }
            });
        }

        if ($tbody.children().length === 0) {
            $tbody.append('<tr><td colspan="2">No data available</td></tr>');
        }
    }

    function callAPI(api, lat, lng) {
        $.ajax({
            url: 'libs/php/apiHandler.php',
            data: { api: api, lat: lat, lng: lng },
            dataType: 'json',
            success: function(data) {
                displayResults(api, data);
            },
            error: function() {
                $('#result').html('<p>Error fetching data from Geonames API.</p>');
            }
        });
    }

    $('#submitGeonames1').click(function() {
        callAPI('nearbyPlace', $('#lat1').val(), $('#lng1').val());
    });

    $('#submitGeonames2').click(function() {
        callAPI('countryCode', $('#lat2').val(), $('#lng2').val());
    });

    $('#submitGeonames3').click(function() {
        callAPI('timezone', $('#lat3').val(), $('#lng3').val());
    });

    $('#submitGeonames4').click(function() {
        callAPI('countrySubdivision', $('#lat4').val(), $('#lng4').val());
    });

    function changeCamelCase(txt){        
        const result = txt.replace(/([A-Z])/g, " $1");
        const finalResult = result.charAt(0).toUpperCase() + result.slice(1);

        return finalResult
    }
});