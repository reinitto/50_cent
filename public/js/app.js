const fromInput = document.getElementById("from");
const uber = document.getElementById("uber");
const fifty = document.getElementById("fifty");
const info = document.getElementsByClassName("info");
const surge = document.getElementById("surge");
let surge_text = document.getElementById("surge_text");
const toggle_from = document.getElementById("toggle_from");
const toInput = document.getElementById("to");
const inputs = document.getElementById("inputs");
const from_container = document.getElementById("from_container");
const distance = document.getElementById("distance");
const time = document.getElementById("time");
const submit = document.getElementById("getRoute");
//Uber pricing constraints
const INITIAL_COST = 0.4;
const PRICE_PER_KM = 0.6;
const PRICE_PER_MIN = 0.14;
const SERVICE_COST = 1.58;
const MIN_PRICE = 10;
let currentPos;
//fake surge multiplier
const getSurgeRatio = (
  hour = new Date().getHours(),
  day = new Date().getDay()
) => {
  if ([4, 5, 6].includes(day)) {
    if (hour > 17 && hour < 25) {
      return 1 + (hour - 17) * 0.5;
    }
    if (hour < 6) {
      return 1 + hour / 2;
    }
  }
  return 1;
};

const SURGE_MULTIPLIER = getSurgeRatio();

// Calculates and displays route
function calculateAndDisplayRoute(
  directionsService,
  directionsDisplay,
  fromLoc,
  toLoc
) {
  directionsService.route(
    {
      origin: fromLoc,
      destination: toLoc,
      avoidTolls: true,
      avoidHighways: false,
      travelMode: google.maps.TravelMode.DRIVING
    },
    function(response, status) {
      if (status == google.maps.DirectionsStatus.OK) {
        directionsDisplay.setDirections(response);
      } else {
        clearInputs(fromInput, toInput);
        window.alert("Directions request failed due to " + status);
      }
    }
  );
  //Makes Price, distance and time visible
  showInfo();
}

//Calculate Distance from A to B
const calculateDistance = (from, to) => {
  //Instantiate distance service
  const distanceService = new google.maps.DistanceMatrixService();
  distanceService.getDistanceMatrix(
    {
      origins: [from],
      destinations: [to],
      travelMode: "DRIVING"
    },
    calculateDistanceCallback
  );
};

// calculateDistance callback
function calculateDistanceCallback(response, status) {
  if (status == "OK") {
    let results = response.rows[0].elements;
    distance.textContent = results[0].distance.text;
    time.textContent = results[0].duration.text;
    //Makes the surge text visible
    isSurge();
    let uberPrice =
      INITIAL_COST +
      SERVICE_COST +
      ((PRICE_PER_KM * results[0].distance.value) / 1000 +
        (PRICE_PER_MIN * results[0].duration.value) / 60) *
        SURGE_MULTIPLIER;
    uber.textContent =
      (uberPrice < MIN_PRICE ? MIN_PRICE.toFixed(1) : uberPrice.toFixed(1)) +
      " euros";
    fifty.textContent =
      (uberPrice < MIN_PRICE
        ? MIN_PRICE.toFixed(2) - 0.5
        : uberPrice.toFixed(2) - 0.5) + " euros";
  }
}
const isSurge = () => {
  if (SURGE_MULTIPLIER > 1) {
    //set text
    surge_text.textContent = `SURGE: ${SURGE_MULTIPLIER}!!`;
    //set visibility
    surge.style.visibility = "visible";
  } else {
    surge.style.visibility = "hidden";
  }
};

//Get location Promise
const getLocation = new Promise((resolve, reject) => {
  navigator.geolocation.getCurrentPosition(function(position) {
    if (position) {
      resolve({
        lat: Number(position.coords.latitude.toFixed(5)),
        lng: Number(position.coords.longitude.toFixed(5))
      });
    } else {
      reject({});
    }
  });
});

//Show Info (Distance and Time) fields
const showInfo = function() {
  [...info].forEach(tag => {
    tag.style.visibility = "visible";
  });
};

//Toggles FROM input
const toggleFromClickHandler = () => {
  if (
    from_container.style.visibility === "hidden" ||
    from_container.style.visibility === ""
  ) {
    fromInput.value = "";
    from_container.style.visibility = "visible";
    toggle_from.textContent = "User current position";
  } else {
    from_container.style.visibility = "hidden";
    toggle_from.textContent = "Different starting point?";

    getLocation.then(location => {
      if (!toInput.value) {
        initMap();
      } else {
        initMap(location, toInput.value);
      }
    });
  }
};
// onSubmit click handler
const submitClickHandler = e => {
  e.preventDefault();
  if (!fromInput.value) {
    getLocation.then(location => {
      if (location) initMap(location, toInput.value);
    });
  } else {
    initMap(fromInput.value, toInput.value);
  }
};
submit.addEventListener("click", submitClickHandler);
toggle_from.addEventListener("click", toggleFromClickHandler);
//Clears values of given arguments
const clearInputs = (...inputs) => {
  inputs.forEach(input => {
    input.value = "";
  });
};
function initMap(a, b) {
  let fromLoc = a,
    toLoc = b,
    map;
  // Map options
  const MAP_OPTIONS = {
    zoom: 13,
    center: toLoc ? null : fromLoc,
    gestureHandling: "greedy",
    disableDefaultUI: true,
    scrollwheel: false,
    styles: new Date().getHours() > 17 ? nightStyles : null
  };
  //get current location if FROM location is not provided
  if (navigator.geolocation && !a) {
    getLocation.then(location => {
      //Set a marker at current location
      new google.maps.Marker({
        position: location,
        map: map,
        title: "You're here",
        animation: google.maps.Animation.DROP
      });
      //center on current/initial location
      map.setCenter(location);
      //set current location variable
      a = location;
    });
  }
  //Instantiate google maps
  map = new google.maps.Map(document.getElementById("map"), MAP_OPTIONS);
  // Instantiate a directions service.
  directionsService = new google.maps.DirectionsService();
  directionsDisplay = new google.maps.DirectionsRenderer({
    map: map
  });

  // Google places API
  // Adds autocomplete to FROM input field
  var autocompleteFrom = new google.maps.places.Autocomplete(fromInput);
  // Adds autocomplete to TO input field
  var autocompleteTo = new google.maps.places.Autocomplete(toInput);

  // Calculate distance and Route
  // only when destination is entered
  if (toLoc) {
    //get Distance from A to b
    calculateDistance(fromLoc, toLoc);

    // calc and display route from A to B
    calculateAndDisplayRoute(
      directionsService,
      directionsDisplay,
      fromLoc,
      toLoc
    );
  }

  //FROM, TO input event listeners
  google.maps.event.addListener(autocompleteFrom, "place_changed", function() {
    autocompleteFrom.getPlace();
  });
  google.maps.event.addListener(autocompleteTo, "place_changed", function() {
    autocompleteTo.getPlace();
  });
}

//I need to get rid of this thing...
const nightStyles = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }]
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }]
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#263c3f" }]
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6b9a76" }]
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#38414e" }]
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#212a37" }]
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9ca5b3" }]
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#746855" }]
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1f2835" }]
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#f3d19c" }]
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#2f3948" }]
  },
  {
    featureType: "transit.station",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }]
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#17263c" }]
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#515c6d" }]
  },
  {
    featureType: "water",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#17263c" }]
  }
];
