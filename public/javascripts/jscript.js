$(document).ready(function() {

   // search
   $('#search').submit(function(e) {
      e.preventDefault();
      $("#weather").addClass("hidden");
      storeSearch();
      updateDataList();
      $.ajax({
         type: "GET",
         url: "/map/" + input.value,
         success: function(result) {
            var pos = {
               lat: result.data[0].geometry.location.lat,
               lng: result.data[0].geometry.location.lng
            };
            addMarker(pos,false);
            getWeatherInfo(pos);
         }
      })
   })

   // handle toggling between google autocomplete and search history
   $("#sinput").focus(function(e) {
      toggleDataList();
   }).on("input", function(e){
      toggleDataList();
   })

});


var map,geocoder,infoWindow,input = sinput,markers = [];

// initialize map
function initMap() {
   geocoder = new google.maps.Geocoder;
   infoWindow = new google.maps.InfoWindow;
   map = new google.maps.Map(document.getElementById('map'), {
      center: {lat: 40.7831, lng: -73.9712},
      zoom: 4,
   });

   // geolocation
   if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function(position) {
         var pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
         };
         addMarker(pos, true);
         getWeatherInfo(pos);
      }, function() {
         handleLocationError(true, infoWindow, map.getCenter());
      });
   } else {
      // Browser doesn't support Geolocation
      handleLocationError(false, infoWindow, map.getCenter());
   }

   // Google Maps Autocomplete
   var options = {
      types: ['(regions)']
   };
   var autocomplete = new google.maps.places.Autocomplete(input, options);

   // update and initialize search history
   updateDataList();
}

function handleLocationError(browserHasGeolocation, infoWindow, pos) {
   infoWindow.setPosition(pos);
   infoWindow.setContent(browserHasGeolocation ?
                        'Error: The Geolocation service failed.' :
                        'Error: Your browser doesn\'t support geolocation.');
   infoWindow.open(map);
}

// clear markers on maps
function clearMarkers() {
   if (markers != undefined) {
      markers.forEach(function(marker) {
         marker.setMap(null);
      });
   }
   markers = [];
}

// add marker to map
function addMarker(position,geolocation) {
   clearMarkers();

   geocoder.geocode({'location': position}, function(results, status) {
      if (status === 'OK') {
         if (results[1]) {
            map.setZoom(11);
            marker = new google.maps.Marker({
            position: position,
            map: map
         });
         markers.push(marker);
         // attempt to get relevant city + state information for the information window
         var city = "", addressComponents = results[1].address_components;
         for(i = 0; i < addressComponents.length; i++) {
            var types = addressComponents[i].types;
            if(types=="political,sublocality,sublocality_level_1") {
               city += addressComponents[i].long_name; // city
            }
            else if(types=="locality,political") {
               city += addressComponents[i].long_name; // city
            }
            else if (types=="administrative_area_level_1,political" && addressComponents[i].short_name.length == 2) {
               city += ', ' + addressComponents[i].short_name; // state
            }
         }
         infoWindow.setContent(city);
         infoWindow.open(map, marker);
         if(geolocation)
            input.value = city
         } else {
            window.alert('No results found');
         }
      } else {
         window.alert('Geocoder failed due to: ' + status);
      }
   });
   map.setCenter(position);
}

// get weather information based on google maps coordinates
function getWeatherInfo(position) {
   var year = new Date().getFullYear();
   var month = new Date().getMonth() + 1;
   var day = new Date().getDate();
   $.ajax({
      type: "GET",
      url: "/weather/" + position.lat + "&" + position.lng + "&" + year + "&" + month + "&" + day,
      success: function(result) {
         var data = JSON.parse(result);
         displayCurrentWeather(data[0].currently, data[0].offset);
         displayHourlyWeather(data[0].hourly.data, data[0].offset);
         displayDailyWeather(data[0].daily.data, data[0].offset);
         drawGraph(data.splice(1,data.length))
      },
   })
   $("#weather").removeClass("hidden");
}

// display current weather data
function displayCurrentWeather(data, offset) {
   var date = formatDateTime(data.time, offset, true);

   $("#curtime").html(date);
   $("#curweather").html(data.summary);
   $("#curtemp").html(Math.round(data.temperature) + "&#8457");
   $("#curapptemp").html(Math.round(data.apparentTemperature) + "&#8457");
   $("#curhumidity").html(Math.round(data.humidity*100) + "%");
   $("#currain").html(Math.round(data.precipProbability *100) + "%");
   $("#curuv").html(data.uvIndex);
}

// display hourly weather
function displayHourlyWeather(data, offset) {
   $("#hourlyweather").empty();
   for(var i = 0; i < data.length; i++) {
      date = formatDateTime(data[i].time, offset, true)

      $("#hourlyweather").append(
         "<table class='hourlytable'> \
            <tr> \
               <th><strong>Time:</strong></th> \
               <td>" + date + "</td> \
            </tr> \
            <tr> \
               <th><strong>Weather:</strong></th> \
               <td>" + data[i].summary + "</td> \
            </tr> \
            <tr> \
               <th><strong>Temperature:</strong></th> \
               <td>" + Math.round(data[i].temperature) + "&#8457</td> \
            </tr> \
            <tr> \
               <th><strong>Feels like:</strong></th> \
               <td>" + Math.round(data[i].apparentTemperature) + "&#8457</td> \
            </tr> \
            <tr> \
               <th><strong>Humidity:</strong></th> \
               <td>" + Math.round(data[i].humidity*100) + "%</td> \
            </tr> \
            <tr> \
               <th><strong>Chance of rain:</strong></th> \
               <td>" + Math.round(data[i].precipProbability *100) + "%</td> \
            </tr> \
            <tr> \
               <th><strong>UV index:</strong></th> \
               <td>" + data[i].uvIndex + "</td> \
            </tr> \
         </table>"
      )
   } 
}

// display daily forecast
function displayDailyWeather(data, offset) {
   $("#dailyweather").empty();
   for(var i = 0; i < data.length; i++) {
      date = formatDateTime(data[i].time, offset, false)

      $("#dailyweather").append(
         "<table class='dailytable'> \
            <tr> \
               <th><strong>Date:</strong></th> \
               <td>" + date + "</td> \
            </tr> \
            <tr> \
               <th><strong>Weather:</strong></th> \
               <td>" + data[i].summary + "</td> \
            </tr> \
            <tr> \
               <th><strong>High:</strong></th> \
               <td>" + Math.round(data[i].temperatureMax) + "&#8457 at " + formatTime(data[i].temperatureMaxTime, offset) + "</td> \
            </tr> \
            <tr> \
               <th><strong>Low:</strong></th> \
               <td>" + Math.round(data[i].temperatureMin)  + "&#8457 at " + formatTime(data[i].temperatureMinTime, offset) + "</td> \
            </tr> \
            <tr> \
               <th><strong>Humidity:</strong></th> \
               <td>" + Math.round(data[i].humidity*100) + "%</td> \
            </tr> \
            <tr> \
               <th><strong>Chance of rain:</strong></th> \
               <td>" + Math.round(data[i].precipProbability *100) + "%</td> \
            </tr> \
            <tr> \
               <th><strong>Sunrise:</strong></th> \
               <td>" + formatTime(data[i].sunriseTime, offset) + "</td> \
            </tr> \
            <tr> \
               <th><strong>Sunset:</strong></th> \
               <td>" + formatTime(data[i].sunsetTime, offset) + "</td> \
            </tr> \
         </table>"
      )
   } 
}


// draw graph based on information retrieved utilizing d3.js
function drawGraph(data) {
   var svg = d3.select("#historygraph"),
      margin = {top: 20, right: 20, bottom: 0, left: 40},
      width = 1000 - margin.left - margin.right,
      height = 300 - margin.top - margin.bottom,
      g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

   // create bar graph variables
   var x0 = d3.scaleBand()
      .rangeRound([0, width])
      .paddingInner(0.1);

   var x1 = d3.scaleBand()
      .padding(0.05);

   var y = d3.scaleLinear()
      .rangeRound([height, 0]);

   var z = d3.scaleOrdinal()
      .range(["#ffd700", "#33ccc7"]);

   // handle data
   data.forEach(function(d) {
      d.time = formatDateTime(d.daily.data[0].time, d.offset, false);
      d.High = +Math.round(d.daily.data[0].temperatureMax);
      d.Low = +Math.round(d.daily.data[0].temperatureMin);
      return d;
   })

   // create keys and domains 
   var keys = ["High", "Low"];
   x0.domain(data.map(function(d) { return d.time; }));
   x1.domain(keys).rangeRound([0, x0.bandwidth()]);
   y.domain([0, 20 + d3.max(data, function(d) { return d3.max(keys, function(key) { return d[key]; }); })]).nice();

   // start adding data to the svg
   g.append("g")
      .selectAll("g")
      .data(data)
      .enter().append("g")
      .attr("transform", function(d) { return "translate(" + x0(d.time) + ",0)"; })
      .selectAll("rect")
      .data(function(d) { return keys.map(function(key) { return {key: key, value: d[key]}; }); })
      .enter().append("rect")
      .attr("x", function(d) { return x1(d.key); })
      .attr("y", function(d) { return y(d.value); })
      .attr("width", x1.bandwidth())
      .attr("height", function(d) { return height - y(d.value); })
      .attr("fill", function(d) { return z(d.key); });

   g.append("g")
      .attr("class", "axis")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x0));

   g.append("g")
      .attr("class", "axis")
      .call(d3.axisLeft(y).ticks(null, "s"))
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", 2)
      .attr("y", 8)
      .attr("dy", "0.32em")
      .attr("fill", "#000")
      .attr("font-weight", "bold")
      .attr("text-anchor", "end")
      .text("Fahrenheit");

   // add the legend
   var legend = g.append("g")
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
      .attr("text-anchor", "end")
      .selectAll("g")
      .data(keys.slice().reverse())
      .enter().append("g")
      .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

   legend.append("rect")
      .attr("x", width + 10)
      .attr("width", 19)
      .attr("height", 19)
      .attr("fill", z);

   legend.append("text")
      .attr("x", width - 24)
      .attr("y", 9.5)
      .attr("dy", "0.32em")
      .text(function(d) { return d; });

   // let svg fit container
   svg = document.querySelector("svg");
   var bbox = svg.getBBox();
   svg.setAttribute("viewBox", [bbox.x, bbox.y, bbox.width, bbox.height]);
   svg.width.baseVal.valueAsString = bbox.width;
   svg.height.baseVal.valueAsString = bbox.height;
}

// store search history information
function storeSearch() {
   // if storage is empty
   if(localStorage.getItem("searchmaphistory") == null) {
      var storage = [];
      storage.push($(input).val());
      localStorage.setItem("searchmaphistory", JSON.stringify(storage));
   } else {
      var storage = localStorage.getItem("searchmaphistory");
      storage = JSON.parse(storage);
      // if storage does not include the term already
      if(!storage.includes($(input).val())) {
         if(storage.length >= 10) { // limit the store to 10
            storage.shift();
            storage.push($(input).val());
         }
         else {
            storage.push($(input).val());
         }
         localStorage.setItem("searchmaphistory", JSON.stringify(storage));
      }
   }
}

// update history datalist
function updateDataList() {
   $('#datalistlocations').empty();
   if(localStorage.getItem("searchmaphistory") != null) {
      var hist = JSON.parse(localStorage.getItem("searchmaphistory"));
      hist.forEach(function(h) {
         $('#datalistlocations').prepend("<option value='" + h + "'>");
      });
   }
}

// format UNIX time from data to standard time plus/minus the offset to display time/date in the search timezone
// if time is true then return formatted date with time included
function formatDateTime(date, offset, time) {
   var t = new Date(date * 1000);
   var tzDifference = offset * 60 + t.getTimezoneOffset();
   t = new Date(t.getTime() + tzDifference * 60 * 1000);
   t = time == true ? moment(t).format('MM/DD/YYYY h:mm A') 
         : moment(t).format('MM/DD/YYYY')
   return t;
}

// format UNIX time to just 12H time format
function formatTime(date, offset) {
   var t = new Date(date * 1000);
   var tzDifference = offset * 60 + t.getTimezoneOffset();
   t = new Date(t.getTime() + tzDifference * 60 * 1000);
   t = moment(t).format('h:mm A') 
   return t;
}

// toggle search box to work with both google maps autocomplete and datalist
function toggleDataList() {
   if(!$("#sinput").val() == ""){
      $('#datalistlocations').empty();
   }
   else{
      updateDataList();
   }
}