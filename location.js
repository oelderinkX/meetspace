var pg = require('pg');
var bodyParser = require('body-parser');
var fs = require("fs");
var common = require('./script/common.js');

var urlencodedParser = bodyParser.urlencoded({ extended: false });

var pool = new pg.Pool(common.postgresConfig());

var countries = [];
var regions = [];
var cities = [];

module.exports = function(app) {
	app.get('/getcountries', function(req, res) {

		if (countries.length > 0) {
			res.send(countries);
		} else {
			var postsql = "select id, name, code from meetspace.countries;";
			pool.connect(function(err, client, done) {
				client.query(postsql, function(err, result) {
					done();

					if (result) {
						for (var i = 0; i < result.rows.length; i++) {
							countries.push({
							  id: result.rows[i].id,
							  name: result.rows[i].name,
							  code: result.rows[i].code,
							});
						}
					}

					res.send(countries);
				});
			});
		}
	});	
}

module.exports = function(app) {
	app.get('/regionsByCountryId', function(req, res) {
		var country_id = req.query.id;
		console.log(country_id);
		var regionByCountry = [];
		
		if (regions.length > 0) {
			for (var i = 0; i < regions.length ; i++) {
				if (regions[i].country_id == country_id) {
					regionByCountry.push({
						id: regions[i].id,
						name: regions[i].name,
						code: regions[i].code,
						country_id: regions[i].country_id
					});
				}
			}			
			res.send(regionByCountry);
		} else {
			var postsql = "select id, name, code, country_id from meetspace.regions;";
			pool.connect(function(err, client, done) {
				client.query(postsql, function(err, result) {
					done();

					if (result) {
						for (var i = 0; i < result.rows.length; i++) {
							regions.push({
							  id: result.rows[i].id,
							  name: result.rows[i].name,
							  code: result.rows[i].code,
							  country_id: result.rows[i].country_id
							});
						}
					}

					for (var i = 0; i < regions.length ; i++) {
						if (regions[i].country_id == country_id) {
							regionByCountry.push({
								id: regions[i].id,
								name: regions[i].name,
								code: regions[i].code,
								country_id: regions[i].country_id
							});
						}
					}
					
					res.send(regionByCountry);
				});
			});
		}
	});	
}

module.exports = function(app) {
	app.get('/citiesByRegionId', function(req, res) {
		var region_id = req.query.id;
		console.log(region_id);
		var citiesByRegion = [];
		
		var postsql = "select id, region_id, country_id, latitude, longitude, name from meetspace.cities where region_id = " + region_id + ";";
		pool.connect(function(err, client, done) {
			client.query(postsql, function(err, result) {
				done();

				if (result) {
					for (var i = 0; i < result.rows.length; i++) {
						cities.push({
						  id: result.rows[i].id,
						  region_id: result.rows[i].region_id,
						  country_id: result.rows[i].country_id,
						  latitude: result.rows[i].latitude,
						  longitude: result.rows[i].longitude,
						  name: result.rows[i].name
						});
					}
				}

				for (var i = 0; i < regions.length ; i++) {
					if (regions[i].region_id == region_id) {
						citiesByRegion.push({
							id: regions[i].id,
							region_id: regions[i].region_id,
							country_id: regions[i].country_id,
							latitude: regions[i].latitude,
							longitude: regions[i].longitude,
							name: regions[i].name
						});
					}
				}
				
				res.send(citiesByRegion);
			});
		});
	});
}