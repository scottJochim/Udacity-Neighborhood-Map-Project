let map;
//markers() stores the map markers created for each object in locations().  See initMap().
let markers = ko.observableArray();
//titles() stores the string location.title for each each object in locations().  See initMap().
let titles = ko.observableArray();
//matches() stores the index(es) of items in titles() that match a seach or selection.  See AppViewModel.selectTitle() and AppViewModel.searchLocations().
let matches = ko.observableArray();
let locations = [
    {title: "Vernon\'s BBQ", location: {lat: 38.662186, lng: -90.3091335}, keywords: ["restaurants", "food", "dining", "barbecue", "BBQ"]},
    {title: "Blueberry Hill", location: {lat: 38.655825, lng: -90.3051857}, keywords: ["restaurants", "food", "dining", "burgers", "beer"]},
    {title: "Grill Stop", location: {lat: 38.6721711, lng: -90.338078}, keywords: ["restaurants", "food", "dining", "burgers", "steak"]},
    {title: "Pi Pizza", location: {lat: 38.65501260000001, lng: -90.2977494}, keywords: ["restaurants", "food", "dining", "pizza"]},
    {title: "House of India", location: {lat: 38.6611271, lng: -90.3559915}, keywords: ["restaurants", "food", "dining", "indian"]},
    {title: "The Tivoli Theater", location: {lat: 38.6556587, lng: -90.3033799}, keywords: ["movies", "theaters", "entertainment"]},
    {title: "The Hi-Pointe Theater", location: {lat: 38.6326471, lng: -90.3050145}, keywords: ["movies", "theaters", "entertainment"]},
    {title: "St Louis Art Museum", location: {lat: 38.6393062, lng: -90.2944911}, keywords: ["attractions", "museums", "art"]},
    {title: "St Louis Science Center", location: {lat: 38.62866289999999, lng: -90.2705766}, keywords: ["attractions", "museums", "education"]}
  ];

function initMap() {
    "use strict";
    //https://stackoverflow.com/questions/4069982/document-getelementbyid-vs-jquery
    map = new google.maps.Map(document.getElementById('map'), {
        //https://stackoverflow.com/questions/9810624/how-to-get-coordinates-of-the-center-of-the-viewed-area-in-google-maps-using-goo
        center: {lat: 38.6505741992262, lng: -90.30530998931883},
        zoom: 13,
        mapTypeControl: false
        });

  let infoWindow = new google.maps.InfoWindow();

  for (let i = 0; i < locations.length; i++) {
    let position = locations[i].location;
    let title = locations[i].title;
    let label = (i+1).toString();
    let marker = new google.maps.Marker({
      position: position,
      title: title,
      id: i,
      label: label
    });
    addMarkerListener(marker);
    markers.push(marker);
    titles.push(marker.title);
  }

  function addMarkerListener(marker) {
    marker.addListener('click', function() {
        openInfoWindow(marker, infoWindow);
        marker.setAnimation(google.maps.Animation.BOUNCE);
        //https://developers.google.com/maps/documentation/javascript/examples/marker-animations
        setTimeout(marker.setAnimation(null), 1000);
    });
}

    showMarkers(markers);
}  //END initMap()



function handleScriptError() {
    alert('Google Maps failed to load!');
}

// function selectTitle() {
//     $('ul li')(function(){ //https://stackoverflow.com/questions/3811313/how-to-get-the-index-of-list-items-on-click-of-li-using-jquery
//         console.log($(this).index());
//     });
// }

function showMarkers(markers) {
    "use strict";
    for (let i = 0; i < markers().length; i++) {
        markers()[i].setMap(map);
    }
}

function openInfoWindow(marker, infoWindow) {
    "use strict";
    if (infoWindow.marker != marker) {
    infoWindow.setContent('');
    infoWindow.marker = marker;
    infoWindow.open(map, marker);
    infoWindow.addListener('closeclick', function() {
      infoWindow.marker = null;
    });
    }
    //Since the foursquare api url doesn't accept place names
    //(see: https://stackoverflow.com/questions/11583447/searching-venues-by-name-only),
    //'ll' takes the position of the marker, converts it to a string and removes
    //the parentheses and space to match the format of the foursquare 'll'.
    let ll = marker.position.toString().slice(1, -1).replace(', ', ',');
$.ajax({
    type: "GET",
    dataType: "jsonp",
    cache: false,
    url: 'https://api.foursquare.com/v2/venues/explore?ll=' + ll + '&limit=30&client_id=IRNNRRUUJKOSZGGEO5TZUEEQOFPT0GBNZQOLJKKFY0CFFNN5&'+
    'client_secret=20XNYOIX4IORXRZ2B43UVSZWL4ITW35T2NHODZNRXPECOVGC&v=20180227',
    success: function(data){
        //parse the data response into the fields to be added to the infoWindow
        let address0 = data.response.groups[0].items[0].venue.location.formattedAddress[0];
        let address1 = data.response.groups[0].items[0].venue.location.formattedAddress[1];
        let phone = data.response.groups[0].items[0].venue.contact.formattedPhone;
        let hours = data.response.groups[0].items[0].venue.hours.status;
        if (!address0) {
            address0 = "Address is not available";
        }
        if (!address1) {
            address1 = '';
        }
        if (!phone) {
            phone = "No phone number available";
        }

        if (!hours) {
            hours = "Hours are not avialable";
        }
        //populate the infoWindow
        infoWindow.setContent('<div><strong>' + marker.title + '</strong></div><br>' +
            '<div>' + address0 + '</div>' +
            '<div>' + address1 + '</div>' +
            '<div>' + phone + '</div>' +
            '<div>' + hours + '</div>' +
            '<div><i>' + "Information provided by " + '<a href="http://foursquare.com">' +
            'foursquare.com</a></i></div>');
        }
    }).fail(function() {
        infoWindow.setContent('<div><strong>' + marker.title + '</strong></div><br>' +
            'Location data is not avialable at this time.');
    });
}

function AppViewModel() {
    "use strict";
    this.search = ko.observable('');
    this.isVisible = ko.observable(true);
    this.selectTitle = function(location) {
        matches.removeAll();
        // https://discussions.udacity.com/t/how-to-get-the-index-from-a-value-of-a-knockout-array/197103
        let selectedTitleIndex = titles().indexOf(location);
        console.log(selectedTitleIndex);
        matches.push(selectedTitleIndex);
        console.log(matches());
        this.hideMarkers();
    };
    this.searchLocations = function() {
        //Because titles() is an array of strings and markers() is an array of objects constructed
        //in initMap() they are handled differently.  For titles() the array is cleared then repopulated
        //with matching titles.  For markers() the matching indexes are compared to it.  Markers
        //at non-matching indexes are hidden.
        for (let i = 0; i < locations.length; i++) {
            //If the text in the search box matches any location titles...
            if (this.search().toLowerCase() == locations[i].title.toLowerCase()) {
                //push the index of the matching location to matches().
                matches.push(i);
            } else {
                for (let j = 0; j < locations[i].keywords.length; j++) {
                    //or is the text in the seach box matches any keyword...
                    if (this.search().toLowerCase() == locations[i].keywords[j].toLowerCase()) {
                        //push the index of the matching location to matches().
                        matches.push(i);
                    }
                }
            }
        }
        //Hide the markers that aren't matched
        this.hideMarkers();
    };

    this.hideMarkers = function() {
        for (let l = 0; l < matches().length; l++) {
            //Use the value of the current matches() item as the index of
            //a marker to be removed from markers()
            let markerIndex = matches()[l];
            //Replace the removed marker with 'null' so that indexes of
            //other markers remain the same.
            //https://www.w3schools.com/jsref/jsref_splice.asp AND https://blog.mariusschulz.com/2016/07/16/removing-elements-from-javascript-arrays
            markers.splice(markerIndex, 1, null);
        }
        for (let m = 0; m < markers().length; m++) {
            //Hide the markers that are not 'null'.
            if (markers()[m]) {
                markers()[m].setMap(null);
            }
        }
        this.search('');
        //If there are no matches, reset the map and alert the user.
        if (matches().length === 0) {
            this.resetMap();
            window.alert('No matches found!');
        }
    };

    // this.selectedTitle = function(true) {
    //     if (true) {
    //         return false;
    //     } else {
    //         return true;
    //     }
    // };

    this.resetMap = function() {
        this.search('');
        this.isVisible(true)
        titles.removeAll();
        markers.removeAll();
        matches.removeAll();
        initMap();
    };
    this.toggleNav = function() {
        $('.nav').toggleClass('open');
        $('.toggle').toggleClass('open');
    };
} //END ViewModel

// Activates knockout.js
ko.applyBindings(new AppViewModel());


