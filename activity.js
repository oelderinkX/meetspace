var pg = require('pg');
var bodyParser = require('body-parser');
var fs = require("fs");
var common = require('./script/common.js');

var urlencodedParser = bodyParser.urlencoded({ extended: false });

var pool = new pg.Pool(common.postgresConfig());

var style1Page = fs.readFileSync(__dirname + "/webpage/activity_style1.html", "utf8");

function addWhereClause(sql, fieldName, fieldValue) {
	var newSql = sql;
	
	if(fieldValue) {
		if (newSql.includes("WHERE")) {
			newSql += ' AND ' + fieldName + '= \'' + fieldValue + '\'';
		} else {
			newSql += ' WHERE ' + fieldName + '= \'' + fieldValue + '\'';
		}
	}
	
	return newSql;
}

function getTime(time) {
	var strTime = time;
	return strTime;
}

function getDay(day) {
	if (day == 0) {
		return "Sunday";
	} else if (day == 1) {
		return "Monday";
	} else if (day == 2) {
		return "Tuesday";
	} else if (day == 3) {
		return "Wednesday";
	} else if (day == 4) {
		return "Thursday";
	} else if (day == 5) {
		return "Friday";
	} else {
		return "Saturday";
	}
}

function getActionButtons(url) {
	var joinbutton = "<input value='Join' type=button click=window.location.href = url + '?action=join'</input>";
	var unjoinbutton = "<input value='Leave' type=button click=window.location.href = url + '?action=unjoin'</input>";
	var attendbutton = "<input value='Attend' type=button click=window.location.href = url + '?action=attend'</input>";
	var unattendbutton = "<input value='Unattend' type=button click=window.location.href = url + '?action=unattend'</input>";
	return joinbutton + unjoinbutton + attendbutton + unattendbutton;
}

function renderPage(country, region, city, game, req, res) {
	//var email = req.cookies['email'];
	//var sessionId = req.cookies['sessionId'];
	
	var webpage = style1Page;
	
	var sql = 'SELECT activityId, title, game, city, region, country, time, day, styleid, description FROM meetspace.activity';
	
	sql = addWhereClause(sql, 'country', country);
	sql = addWhereClause(sql, 'region', region);
	sql = addWhereClause(sql, 'city', city);
	sql = addWhereClause(sql, 'game', game);
	
	sql += ' LIMIT 10';
	
	pool.connect(function(err, client, done) {
		
		if(err) {
			console.log("ERROR! " + err)
		}
		
		client.query(sql, function(err, result) {
			done();
			
			if (err) {
				console.log("errors!");
			} else {
				if (result.rows.length == 1) {
					var title = result.rows[0].title;
					var time = result.rows[0].time;
					var day = result.rows[0].day;
					var activityId = result.rows[0].activityid;
					
					game = result.rows[0].game;
					description = result.rows[0].description;
					var actionlink = '/' + country;
					if (region) {
						actionlink += '/' + region;
					}
					actionlink += '/' + city;
					actionlink += '/' + game;
					
					webpage = webpage.replace('!%TITLE%!', title + ', ' + getDay(day) + ' ' + getTime(time));
					webpage = webpage.replace('!%DESCRIPTION%!', description);
					webpage = webpage.replace('!%ACTION%!', actionlink);
					
					var whosgoingsql = "SELECT meetspace.user.username, meetspace.whosgoing.status FROM meetspace.whosgoing JOIN meetspace.user ON meetspace.whosgoing.userId = meetspace.user.id WHERE meetspace.whosgoing.activityId = " + activityId;
					
					pool.connect(function(err, client, done) {
						client.query(whosgoingsql , function(err, result) {
							done();
							
							var whosgoinglist = '';
							var notattendinglist = '';
							
							if (!result) {
								webpage = webpage.replace('!%WHOSGOING%!', 'No body');
							} else {
								for (var i = 0; i < result.rows.length; i++) {
									var username = result.rows[i].username;
									var status = result.rows[i].status;
									
									if (status == 1) {
										whosgoinglist += username + '<br/>';
									} else {
										notattendinglist += username + '<br/>';
									}
								}
								
								webpage = webpage.replace('!%WHOSGOING%!', whosgoinglist);
								webpage = webpage.replace('!%NOTATTEND%!', notattendinglist);								
							}

							res.send(webpage);
						});
					});
				} else if (result.rows.length == 0) {
					//display 'would you like to create'
					var details = 'no activty for ' + game + '.  Would you like to create it?';
					details += '</body></html>';
					res.send(details);
				} else if (result.rows.length > 1) {
					var details = 'Activities in your area:<br/><br/>';
					
					for (var i = 0; i < result.rows.length; i++) {
						var title = result.rows[i].title
						game = result.rows[i].game;
						city = result.rows[i].city;
						region = result.rows[i].region;
						country = result.rows[i].country;
						description = result.rows[i].description;
						
						var link = 'https://meetspacev1.herokuapp.com/';
						if (region) {
							link += country + '/' + region + '/' + city + '/' + game;
						} else {
							link += country + '/' + city + '/' + game;
						}
						
						details += title + ' <a href="' + link + '">' + link + '</a><br/>';
					}
					
					details += '</body></html>';
					res.send(details);
				}
			}
		});
	});
}

function performAction(country, region, city, game, action, req, res) {
	if (action) {
		if (action == 'join') {
			sql = 'insert into meetspace.whosgoing (activityid, userid, status) values (1,1,1);';
			
			pool.connect(function(err, client, done) {
				client.query(sql, function(err, result) {
					done();
					
					renderPage(country, region, city, game, req, res);
				});
			});
		} else if (action == 'unjoin') {
			sql = 'delete from meetspace.whosgoing where activityid = 1 and userid = 1;';
			
			pool.connect(function(err, client, done) {
				client.query(sql, function(err, result) {
					done();
					
					renderPage(country, region, city, game, req, res);
				});
			});			
		} else if (action == 'attend') {
			sql = 'update meetspace.whosgoing set status=1 where activityid = 1 and userid = 1;';
			
			pool.connect(function(err, client, done) {
				client.query(sql, function(err, result) {
					done();
					
					renderPage(country, region, city, game, req, res);
				});
			});	
		} else if (action == 'unattend') {
			sql = 'update meetspace.whosgoing set status=0 where activityid = 1 and userid = 1;';
			
			pool.connect(function(err, client, done) {
				client.query(sql, function(err, result) {
					done();
					
					renderPage(country, region, city, game, req, res);
				});
			});				
		} else {
			renderPage(country, region, city, game, req, res);
		}
		
	} else {
		renderPage(country, region, city, game, req, res);
	}
}

module.exports = function(app) {
    app.get('*', function(req, res) {
		var url = req.url;
		var params = url.split("/");
		
		var country = '';
		var city = '';
		var region = '';
		var game = '';
		
		if(params.length === 4) {
			country = params[1];
			city = params[2];
			game = params[3];
		} else if (params.length === 5) {
			country = params[1];
			region = params[2];
			city = params[3];
			game = params[4];
		} else {
			//details = 'unknown activity';
			//res.send(details);
		}
		
		renderPage(country, region, city, game, req, res);
    });
	
   app.post('*', urlencodedParser, function(req, res) {
		var action = req.body.action;
		
		console.log('action: ' + action);
		
		var url = req.url;
		var params = url.split("/");
		
		var country = '';
		var city = '';
		var region = '';
		var game = '';
		
		if(params.length === 4) {
			country = params[1];
			city = params[2];
			game = params[3];
		} else if (params.length === 5) {
			country = params[1];
			region = params[2];
			city = params[3];
			game = params[4];
		} else {
			//details = 'unknown activity';
			//res.send(details);
		}
		
		performAction(country, region, city, game, action, req, res);
    });	
}