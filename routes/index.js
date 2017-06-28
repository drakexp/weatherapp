'use strict';
var express = require('express');
var router = express.Router();
var request = require('request');
var googleMapsClient = require('@google/maps').createClient({
  key: 'AIzaSyCfgQ-r24bVOLN2X6WqBPXjvwqd-aTeEJU'
});
var gmapsurl = "https://maps.googleapis.com/maps/api/geocode/json?";
var DarkSky = require('dark-sky');
var forecast;

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Weather App' });
});

router.get("/map/:location", function(req, res, next) {
   var location = req.params.location;
   googleMapsClient.geocode({
      address: location
   }, function(err, response) {
      if (!err) {
         res.status(200)
         .json({
            data: response.json.results,
         });
      }
      else
         console.log(err)
   });
})

router.get("/weather/:latitude&:longitude&:year&:month&:day", function(req, res, next) {
   forecast = new DarkSky('80901354988cf5e12a24cda550279f53');
   var lat = req.params.latitude;
   var lng = req.params.longitude;
   var year = req.params.year;
   var month = req.params.month;
   var day = req.params.day;
   var promises = [];
   for(var i = 6; i > 0; i--) {
      if(i == 6) {
         promises.push(forecast
            .latitude(lat)
            .longitude(lng)
            .exclude('minutely,flags,alerts')
            .get()
            .then(resp => {
               return resp;
            })
            .catch(err => {
               console.log(err)
            }))
      }
      else {
         promises.push(forecast
            .latitude(lat)
            .longitude(lng)
            .exclude('minutely,flags,alerts,hourly')
            .time(year-i + '-' + month + '-' + day)
            .get()
            .then(resp => {
               return resp;
            })
            .catch(err => {
               console.log(err)
         }))         
      }
   }
   Promise.all(promises).then(values=> {
      res.send(JSON.stringify(values))
   })
})

module.exports = router;
