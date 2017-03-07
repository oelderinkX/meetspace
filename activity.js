var pg = require('pg');
var bodyParser = require('body-parser');
var fs = require("fs");
var common = require('./script/common.js');
var renderElement = require('./script/renderElement.js');
var notifications = require('./notifications.js');

var urlencodedParser = bodyParser.urlencoded({ extended: false });

var pool = new pg.Pool(common.postgresConfig());

var style1Page = fs.readFileSync(__dirname + "/webpage/activity_style1.html", "utf8");
var listPage = fs.readFileSync(__dirname + "/webpage/activity_list.html", "utf8");
var infoPage = fs.readFileSync(__dirname + "/webpage/infopage.html", "utf8");

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

function getUrl(country, region, city, game) {
	var url = common.webpage_url;
	
	if (region) {
		url += country + '/' + region + '/' + city + '/' + game;
	} else {
		url += country + '/' + city + '/' + game;
	}
	
	return url;
}

function renderPage(country, region, city, game, req, res) {
	var email = req.cookies['email'];
	//var sessionId = req.cookies['sessionId'];

	var webpage = style1Page;
	
	var username = req.cookies['username'];
	var sessionId = req.cookies['sessionId'];
	
	getUrl(country, region, city, game);
	
	webpage = renderElement.login(webpage, username, common.webpage_url);
	
	//var sql = 'SELECT activityId, title, game, city, region, country, time, day, styleid, description FROM meetspace.activity';
	
	var sql = "SELECT * FROM meetspace.get_activity_details($1, $2, $3, $4, $5, $6);"
	
	//sql = addWhereClause(sql, 'country', country);
	//sql = addWhereClause(sql, 'region', region);
	//sql = addWhereClause(sql, 'city', city);
	//sql = addWhereClause(sql, 'game', game);
	
	pool.connect(function(err, client, done) {
		
		if(err) {
			console.log("ERROR! " + err)
		}
		
		client.query(sql, [email, sessionId, country, region, city, game], function(err, result) {
			done();
			
			if (err) {
				console.log("errors!");
			} else {
				if (result.rows.length == 1) {
					
					console.log(result);
					
					var title = result.rows[0].ret_title;
					var time = result.rows[0].ret_time;
					var day = result.rows[0].ret_day;
					var activityId = result.rows[0].ret_activityid;
					
					var showjoin = 'none';
					var showunjoin = 'none';
					var showattend = 'none';
					var showunattend = 'none';
					var showreset = 'none';
					
					var showpost = 'none'; 
					var showinvite = 'none'; 
					
					game = result.rows[0].ret_game;
					description = result.rows[0].ret_description;
					var actionlink = '/' + country;
					if (region) {
						actionlink += '/' + region;
					}
					actionlink += '/' + city;
					actionlink += '/' + game;
					
					if (username && sessionId) {
						showjoin = 'inline';
						showunjoin = 'inline';
						showattend = 'inline';
						showunattend = 'inline';
						showreset = 'inline';
						showpost = 'inline';
						showinvite = 'inline';
					}
					
					webpage = renderElement.activityTitle(webpage, title);
					webpage = renderElement.activityTime(webpage, day, time);
					webpage = webpage.replace('!%DESCRIPTION%!', description);
					webpage = common.replaceAll(webpage, '!%ACTION%!', actionlink);
					webpage = common.replaceAll(webpage, '!%ACTIVITYID%!', activityId);
										
					webpage = common.replaceAll(webpage, '!%SHOWJOIN%!', showjoin);
					webpage = common.replaceAll(webpage, '!%SHOWUNJOIN%!', showunjoin);
					webpage = common.replaceAll(webpage, '!%SHOWATTEND%!', showattend);
					webpage = common.replaceAll(webpage, '!%SHOWUNATTEND%!', showunattend);
					webpage = common.replaceAll(webpage, '!%SHOWRESET%!', showreset);
					
					webpage = webpage.replace('!%SHOWPOST%!', showpost);
					webpage = webpage.replace('!%SHOWINVITE%!', showinvite);
					
					res.cookie('activity' , actionlink);
					
					var whosgoingsql = "SELECT meetspace.user.username, meetspace.whosgoing.status FROM meetspace.whosgoing JOIN meetspace.user ON meetspace.whosgoing.userId = meetspace.user.id WHERE meetspace.whosgoing.activityId = " + activityId;
					
					pool.connect(function(err, client, done) {
						client.query(whosgoingsql , function(err, result) {
							done();
							
							var whosgoing = [];
							var whosnot = [];
							
							if (!result) {
								whosnot.push('no body');
							} else {
								for (var i = 0; i < result.rows.length; i++) {
									var username = result.rows[i].username;
									var status = result.rows[i].status;
									
									if (status == 1) {
										whosgoing.push(username);
									} else {
										whosnot.push(username);
									}
								}
								
								webpage = renderElement.whosgoing(webpage, whosgoing, whosnot);
							}

							var postsql = "SELECT username, message, postdate FROM meetspace.post INNER JOIN meetspace.user ON meetspace.post.userid = meetspace.user.id WHERE activityid = $1 ORDER BY postdate DESC;";
							
							pool.connect(function(err, client, done) {
								client.query(postsql, [activityId], function(err, result) {
									done();
							
									var postdates  = [];
									var postusernames  = [];
									var postmessages  = [];
							
									if(result) {
										for (var i = 0; i < result.rows.length; i++) {
											var postusername = result.rows[i].username;
											var postmessage = result.rows[i].message;
											var postdate = result.rows[i].postdate;
											
											postdates.push(postdate);
											postusernames.push(postusername);
											postmessages.push(postmessage);
										}
									}
							
									webpage = renderElement.posts(webpage, country, region, postdates, postusernames, postmessages);
							
									res.send(webpage);
								});
							});
						});
					});
				} else if (result.rows.length == 0) {
					var noactivityPage = infoPage;
					
					if (game) {
						noactivityPage = noactivityPage.replace('!%MESSAGE%!', 'no activty for ' + game + '.  Would you like to create it?');
					} else {
						noactivityPage = noactivityPage.replace('!%MESSAGE%!', 'no activties in your area');
					}

					res.send(noactivityPage);
				} else if (result.rows.length > 1) {
					webpage = listPage;
					
					var titlelist = [];
					var gamelist = [];
					var citylist = [];
					var regionlist = [];
					var countrylist = [];
					var descriptionlist = [];
					var linklist = [];
					
					for (var i = 0; i < result.rows.length; i++) {
						var title = result.rows[i].ret_title
						game = result.rows[i].ret_game;
						city = result.rows[i].ret_city;
						region = result.rows[i].ret_region;
						country = result.rows[i].ret_country;
						description = result.rows[i].ret_description;
						
						var link = getUrl(country, region, city, game);
						
						titlelist.push(title);
						gamelist.push(game);
						citylist.push(city);
						regionlist.push(region);
						countrylist.push(country);
						descriptionlist.push(description);
						linklist.push(link);
					}
					
					webpage = renderElement.activities(webpage, titlelist, gamelist, citylist, regionlist, countrylist, descriptionlist, linklist);
					
					res.send(webpage);
				}
			}
		});
	});
}

function performAction(country, region, city, game, action, req, res) {
	var email = req.cookies['email'];
	var sessionId = req.cookies['sessionId'];
	var username = req.cookies['username'];
	var sql = '';
	
	var activityId = req.body.activityId;
	console.log('activityId:' + activityId);
	
	if (action) {
		if (action == 'join') {
			sql = "SELECT meetspace.join_activity('" + email + "', '" + sessionId + "', " + activityId + ");";
			
			console.log('sql: ' + sql);
			
			pool.connect(function(err, client, done) {
				client.query(sql, function(err, result) {
					done();
					
					renderPage(country, region, city, game, req, res);
				});
			});
		} else if (action == 'unjoin') {
			sql = "SELECT meetspace.unjoin_activity('" + email + "', '" + sessionId + "', " + activityId + ");";
			
			pool.connect(function(err, client, done) {
				client.query(sql, function(err, result) {
					done();
					
					renderPage(country, region, city, game, req, res);
				});
			});			
		} else if (action == 'attend') {
			sql = "SELECT meetspace.attend_activity('" + email + "', '" + sessionId + "', " + activityId + ");";
			
			pool.connect(function(err, client, done) {
				client.query(sql, function(err, result) {
					done();
					
					renderPage(country, region, city, game, req, res);
				});
			});	
		} else if (action == 'unattend') {
			sql = "SELECT meetspace.unattend_activity('" + email + "', '" + sessionId + "', " + activityId + ");";
			
			pool.connect(function(err, client, done) {
				client.query(sql, function(err, result) {
					done();
					
					renderPage(country, region, city, game, req, res);
				});
			});
		} else if (action == 'post') {
			sql = "select * FROM meetspace.get_emails_for_activity('" + email + "', '" + sessionId + "', " + activityId + ");";
			
			pool.connect(function(err, client, done) {
				client.query(sql, function(err, result) {
					done();

					for (var i = 0; i < result.rows.length; i++) {
						var toEmail = result.rows[i].ret_email;
						var activityTitle = result.rows[i].ret_activitytitle;
					
						notifications.sendPostEmail(toEmail, username, activityTitle, req.body.postmessage);
					}
					
					sql = "SELECT meetspace.post_message($1, $2, $3, $4);";

					pool.connect(function(err, client, done) {
						client.query(sql, [ email, sessionId, activityId, req.body.postmessage], function(err, result) {
							renderPage(country, region, city, game, req, res);
						});
					});
				});
			});		
		} else if (action == 'invite') {
			sql = "select * FROM meetspace.check_credentials('" + email + "', '" + sessionId + "', " + activityId + ");";
			
			pool.connect(function(err, client, done) {
				client.query(sql, function(err, result) {
					done();
				
					if (result && result.rows && result.rows.length == 1) {
						var isValid = result.rows[0].ret_valid;
						var activityTitle = result.rows[0].ret_title;
					
						if (isValid) {
							notifications.sendInviteEmail(req.body.toemail, getUrl(country, region, city, game), activityTitle);
						}
					}
					
					renderPage(country, region, city, game, req, res);
				});
			});				
		} else if (action == 'reset') {
			sql = "select * FROM meetspace.reset_acitivty('" + email + "', '" + sessionId + "', " + activityId + ");";
			
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
    app.get('*', urlencodedParser, function(req, res) {
		var url = req.url;
		var params = url.split("/");
		
		var country = '';
		var city = '';
		var region = '';
		var game = '';

		if (params.length > 1) {
			country = params[1];
		}
		
		if(country == 'usa') {
			region = params[2];
			city = params[3];
			game = params[4];
		} else {
			city = params[2];
			game = params[3];
		}
		
		renderPage(country, region, city, game, req, res);
    });
	
   app.post('*', urlencodedParser, function(req, res) {
		var action = req.body.action;
	
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