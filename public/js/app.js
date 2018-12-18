const from = document.getElementById("from");
const uber = document.getElementById("uber");
const fifty = document.getElementById("fifty");
const info = document.getElementsByClassName("info");
const toggle_from = document.getElementById("toggle_from");
const to = document.getElementById("to");
const inputs = document.getElementById("inputs");
const from_container = document.getElementById("from_container");
const distance = document.getElementById("distance");
const time = document.getElementById("time");
const submit = document.getElementById("getRoute");
let map, currentPos;

console.log("info: ", info);

//Toggles FROM input
toggle_from.addEventListener("click", function() {
  if (from_container.style.visibility === "hidden") {
    from.value = "";
    from_container.style.visibility = "visible";
    toggle_from.textContent = "User current position";
  } else {
    from_container.style.visibility = "hidden";
    toggle_from.textContent = "Different starting point?";
    getLocation.then(location => {
      initMap(location, to.value);
    });
  }
});
// onSubmit click handler
submit.addEventListener("click", function(e) {
  e.preventDefault();
  if (!from.value) {
    console.log("no from value!");
    getLocation.then(location => {
      console.log(location);
      if (location) initMap(location, to.value);
    });
  } else {
    initMap(from.value, to.value);
    console.log(from.value);
    console.log(to.value);
  }

  console.log("Submit");
});

function initMap(a, b) {
  //Hide info class fields

  //get current location if FROM location is not provided
  if (navigator.geolocation && !a) {
    getLocation.then(location => {
      //Set a marker at current location
      new google.maps.Marker({
        position: location,
        map: map,
        title: "You're here"
      });
      //center on current/initial location
      map.setCenter(location);
      //set current location variable
      a = location;
    });
  }
  //From location
  var pointA = a,
    //To location
    pointB = b,
    // Map options
    myOptions = {
      zoom: 13,
      center: pointB ? null : pointA,
      gestureHandling: "greedy",
      disableDefaultUI: true,
      scrollwheel: false
    },
    map = new google.maps.Map(document.getElementById("map"), myOptions),
    // Instantiate a directions service.
    directionsService = new google.maps.DirectionsService(),
    directionsDisplay = new google.maps.DirectionsRenderer({
      map: map
    });
  // Google places API
  // Adds autocomplete to FROM input field
  var autocompleteFrom = new google.maps.places.Autocomplete(from);
  google.maps.event.addListener(autocompleteFrom, "place_changed", function() {
    var place = autocompleteFrom.getPlace();
    console.log("From: ", place);
  });

  // Google places API
  // Adds autocomplete to TO input field
  var autocompleteTo = new google.maps.places.Autocomplete(to);
  google.maps.event.addListener(autocompleteTo, "place_changed", function() {
    var place = autocompleteTo.getPlace();
    console.log("TO: ", place);
  });
  // Calculate distance and Route
  // only when destination is entered
  if (pointB) {
    //get Distance from A to b
    calculateDistance(pointA, pointB);

    // get route from A to B
    calculateAndDisplayRoute(
      directionsService,
      directionsDisplay,
      pointA,
      pointB
    );
  }
}
// Calculates and displays route
function calculateAndDisplayRoute(
  directionsService,
  directionsDisplay,
  pointA,
  pointB
) {
  //Hide info class fields
  [...info].forEach(tag => {
    tag.style.visibility = "visible";
  });

  directionsService.route(
    {
      origin: pointA,
      destination: pointB,
      avoidTolls: true,
      avoidHighways: false,
      travelMode: google.maps.TravelMode.DRIVING
    },
    function(response, status) {
      if (status == google.maps.DirectionsStatus.OK) {
        directionsDisplay.setDirections(response);
      } else {
        window.alert("Directions request failed due to " + status);
      }
    }
  );
}

//Calculate Distance from A to b
const calculateDistance = (from, to) => {
  var service = new google.maps.DistanceMatrixService();
  console.log("from: ", from);
  service.getDistanceMatrix(
    {
      origins: [from],
      destinations: [to],
      travelMode: "DRIVING"
    },
    calculateDistanceCallback
  );
  // calculateDistance callback
  function calculateDistanceCallback(response, status) {
    if (status == "OK") {
      const initialCost = 0.4;
      const pricePerKm = 0.6;
      const pricePerMin = 0.14;
      const serviceCost = 1.58;
      console.log("distance: ", response);
      var results = response.rows[0].elements;
      distance.textContent = results[0].distance.text;
      time.textContent = results[0].duration.text;
      var uberPrice =
        initialCost +
        serviceCost +
        (pricePerKm * results[0].distance.value) / 1000 +
        (pricePerMin * results[0].duration.value) / 60;
      uber.textContent = uberPrice.toFixed(1) + " euros";
      fifty.textContent = uberPrice.toFixed(2) - 0.5 + " euros";
    }
  }
};
//returns your location Promise
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
