var pg = require('pg');
var bodyParser = require('body-parser');
var fs = require("fs");
var common = require('./script/common.js');

var urlencodedParser = bodyParser.urlencoded({ extended: false });

var pool = new pg.Pool(common.postgresConfig());

var countries = [];
exports.Countries = countries;
var regions = [];
var cities = [];

function retrieveCountries(callback) {
	if (countries.length > 0) {
		return callback();
	} else {
		var postsql = "select id, name, code from meetspace.countries order by name;";
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

				return callback();
			});
		});
	}
}
module.exports.RetrieveCountries = retrieveCountries;

// function retrieveActiveCountries(callback) {
// 	if (countries.length > 0) {
// 		return callback();
// 	} else {
// 		var postsql = "select id, name, code from meetspace.countries where code in (select distinct(country) from meetspace.activity) order by name;";
// 		pool.connect(function(err, client, done) {

// 			if (err) {
// 				console.log('DB Connection Error!!!!!!');
// 				console.log(err);
// 			}

// 			client.query(postsql, function(err, result) {
// 				done();

// 				if (result) {
// 					for (var i = 0; i < result.rows.length; i++) {
// 						console.log('loading country ' + result.rows[i].name);
// 						countries.push({
// 						  id: result.rows[i].id,
// 						  name: result.rows[i].name,
// 						  code: result.rows[i].code,
// 						});
// 					}
// 				}

// 				return callback();
// 			});
// 		});
// 	}
// }
// module.exports.RetrieveActiveCountries = retrieveActiveCountries;

async function retrieveActiveCountries() {
	if (countries.length > 0) {
		return countries;
	} else {
		var postsql = "select id, name, code from meetspace.countries where code in (select distinct(country) from meetspace.activity) order by name;";

		let client = await pool.connect();
		let result = await client.query(postsql);

		if (result) {
			for (var i = 0; i < result.rows.length; i++) {
				console.log('loading country ' + result.rows[i].name);
				countries.push({
					id: result.rows[i].id,
					name: result.rows[i].name,
					code: result.rows[i].code,
				});
			}
		}

		return countries;
		// pool.connect(function(err, client, done) {

		// 	if (err) {
		// 		console.log('DB Connection Error!!!!!!');
		// 		console.log(err);
		// 	}

		// 	client.query(postsql, function(err, result) {
		// 		done();

		// 		if (result) {
		// 			for (var i = 0; i < result.rows.length; i++) {
		// 				console.log('loading country ' + result.rows[i].name);
		// 				countries.push({
		// 				  id: result.rows[i].id,
		// 				  name: result.rows[i].name,
		// 				  code: result.rows[i].code,
		// 				});
		// 			}
		// 		}

		// 		return callback();
		// 	});
		// });
	}
}
module.exports.RetrieveActiveCountries = retrieveActiveCountries;


// function getActiveCountries(res) {
// 	retrieveActiveCountries(function() {
// 		res.send(countries);
// 	});
// }

async function getActiveCountries(res) {
	retrieveActiveCountries().then( function(countries) {
		res.send(countries);
	});
}

function getCountries(res) {
	retrieveCountries(function() {
		res.send(countries);
	});
}

function getRegionByCountry(res, id) {
	var regionByCountry = [];
	
	if (regions.length > 0) {
		for (var i = 0; i < regions.length ; i++) {
			if (regions[i].country_id == id) {
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
		var postsql = "select id, name, code, country_id from meetspace.regions order by name;";
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
					if (regions[i].country_id == id) {
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
}

function getCitiesByRegion(res, id) {
	var citiesByRegion = [];
	
	var postsql = "select id, region_id, country_id, latitude, longitude, name from meetspace.cities where region_id = " + id + " order by name;";
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

			for (var i = 0; i < cities.length ; i++) {
				if (cities[i].region_id == id) {
					citiesByRegion.push({
						id: cities[i].id,
						region_id: cities[i].region_id,
						country_id: cities[i].country_id,
						latitude: cities[i].latitude,
						longitude: cities[i].longitude,
						name: cities[i].name
					});
				}
			}
			
			res.send(citiesByRegion);
		});
	});
}

// module.exports = function(app) {
// 	app.get('/location', function(req, res) {
// 		var get = req.query.get;
// 		var id = req.query.id;
// 		var empty = [];
		
// 		if (get == "countries") {
// 			getCountries(res);
// 		} else if (get == "activeCountries") {
// 			getActiveCountries(res);
// 		} else if (get == "regions" && id) {
// 			getRegionByCountry(res, id);
// 		} else if (get == "cities" && id) {
// 			getCitiesByRegion(res, id);
// 		} else {
// 			res.send(empty);
// 		}
// 	});	
// }


module.exports = function(app) {
	app.get('/location', async function(req, res) {
		var get = req.query.get;
		var id = req.query.id;
		var empty = [];
		
		if (get == "countries") {
			getCountries(res);
		} else if (get == "activeCountries") {
			await getActiveCountries(res);
		} else if (get == "regions" && id) {
			getRegionByCountry(res, id);
		} else if (get == "cities" && id) {
			getCitiesByRegion(res, id);
		} else {
			res.send(empty);
		}
	});	
}