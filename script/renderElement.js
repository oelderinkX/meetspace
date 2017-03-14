var dateFormat = require('dateformat');

function getTime(time) {
	var datetime = new Date();

	var timeSplit = time.split(":");
	
	datetime.setHours(timeSplit[0]);
	datetime.setMinutes(timeSplit[1]);
	
	var strTime = dateFormat(datetime, "h:MM tt");
	
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

///
/// Need to add daylight savings
///
function getGmtAdjustedDateTime(datetime, country, region) {
	var daylightsavings = 0;
	
	if (country == 'nz') {
		if (datetime.getMonth() < 4 || datetime.getMonth() > 9 ) {
			daylightsavings	= 1;
		}
		
		datetime.setHours(datetime.getHours() + 12 + daylightsavings);
	}
	
	return datetime;
}

function activityTitle(webpage, title) {
  
  webpage = webpage.replace('!%TITLE%!', title);
  
  return webpage;
}
module.exports.activityTitle = activityTitle;

function activityTime(webpage, day, time) {
	webpage = webpage.replace('!%TIME%!', getDay(day) + ' ' + getTime(time));
	
	return webpage;
}
module.exports.activityTime = activityTime;  

function posts(webpage, country, region, postdates, postusernames, postmessages) {
	var YOUTUBELINK_SEARCH = "https://www.youtube.com/watch?";
	
	var postElement = '<dl>';
	for(var i = 0; i < postdates.length; i++) {
		var postmessage = postmessages[i];
		
		var youtubeLinkStart = postmessage.indexOf(YOUTUBELINK_SEARCH);
		if (youtubeLinkStart != -1) {
			youtubeLinkEnd = postmessage.indexOf(" ", youtubeLinkStart);
			
			if (youtubeLinkEnd == -1) {
				youtubeLinkEnd = postmessage.length;
			}
			
			var youtubeEmedded = '<div class="embed-container"><iframe class="col-sm-6" frameborder="0" src="';
			youtubeEmedded += postmessage.substr(youtubeLinkStart, youtubeLinkEnd);
			youtubeEmedded += '"></iframe></div>';
			youtubeEmedded = youtubeEmedded.replace('watch?v=' ,'embed/');

			//console.log("EMBED: " + youtubeLinkStart + ' ' + youtubeLinkEnd);
			//console.log("EMBED: " + postmessage.substr(youtubeLinkStart, youtubeLinkEnd));
			
			postmessage = postmessage.substring(0,youtubeLinkStart) + youtubeEmedded + postmessage.substring(youtubeLinkEnd);
		}
		
		var adjustedDateTime = getGmtAdjustedDateTime(postdates[i], country, region);
		postElement += '<dt>' + postmessage + '</dt><dd>&nbsp;&nbsp;&nbsp;- ' + postusernames[i] + ', ' +  dateFormat(adjustedDateTime, "mmmm dS, yyyy, h:MM:ss TT") + '</dd><br/>';
	}
	postElement += '</dl>';
	
	webpage = webpage.replace('!%POSTS%!', postElement);
	
	return webpage;
}
module.exports.posts = posts;

function login(webpage, username, url) {
	var element = '';
	
	if (username) {
		//webpage = webpage.replace('!%LOGIN%!', '<form action="' + url + 'logout">' + username + ' <input type="submit" value="Logout" /></form>');
		element = '<div class="btn-group">';
		element += '<button type="button" class="btn btn-default dropdown-toggle btn-primary" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">';
		element += username;
		element += '<span class="caret"></span>';
		element += '</button>';
		element += '<ul class="dropdown-menu">';
		element += '<li><a href="' + url + 'logout">Logout</a></li>';
		element += '</ul>';
		element += '</div>';
	} else {
		//webpage = webpage.replace('!%LOGIN%!', '<form action="' + url + 'login"><input type="submit" value="Login" /></form>');
		element = '<div class="btn-group">';
		element += '<a href="' + url + 'login' + '" class="btn btn-default btn-primary" role="button">Login</a>';
		element += '</div>';
	}
	
	webpage = webpage.replace('!%LOGIN%!', element);
	
	return webpage;
}
module.exports.login = login;

function whosgoing(webpage, whosgoing, whosnot) {
	var whosgoingElement = '<ol>';
	var whosnotElement = '<ul>';
	
	for(var i = 0; i < whosgoing.length; i++) {
		whosgoingElement += '<li>' + whosgoing[i] + '</li>';
	}
	whosgoingElement += '</ol>';

	for(var i = 0; i < whosnot.length; i++) {
		whosnotElement += '<li style="color:#CCCCCC">' + whosnot[i] + '</li>';
	}
	whosnotElement += '</ul>';
	
	webpage = webpage.replace('!%WHOSGOING%!',whosgoingElement);
	webpage = webpage.replace('!%NOTATTEND%!', whosnotElement);	
	
	
	return webpage;
}
module.exports.whosgoing = whosgoing;

function activities(webpage, titlelist, gamelist, citylist, regionlist, countrylist, descriptionlist, linklist) {
	var activitieElement = '<div class="list-group">\n';
	
	for(var i = 0; i < titlelist.length; i++) {
		activitieElement += '\t<a href="' + linklist[i] + '" class="list-group-item list-group-item-action flex-column align-items-start">\n';
		activitieElement += '\t\t<div class="d-flex w-100 justify-content-between">\n';
		activitieElement += '\t\t\t<h5 class="mb-1">' + titlelist[i] + '</h5>\n';
		activitieElement += '\t\t\t\t<small class="text-muted">' + citylist[i] + '</small>\n';
		activitieElement += '\t\t</div>\n';
		activitieElement += '\t<p class="mb-1">' + descriptionlist[i] + '</p>\n';
		activitieElement += '\t</a>\n';
	}
	
	activitieElement += '</div>';
	
	webpage = webpage.replace('!%ACTIVITYLIST%!', activitieElement);
	
	return webpage;
}
module.exports.activities = activities;

function error(webpage, error) {
	var errorElement = '<span class="list-group-item list-group-item-action list-group-item-danger">';
	errorElement += error;
	errorElement += '</span>';
	
	webpage = webpage.replace('!%ERROR STATUS%!', errorElement);
	
	return webpage;
}
module.exports.error = error;

function breadcrumb(webpage, country, region, city, game) {
	var breadcrumbElement = '<a href="/">Home</a> / ';
	breadcrumbElement += '<a href="/' + country + '">' + country + '</a> / ';
	
	if (region) {
		breadcrumbElement += '<a href="/' + region + '">' + region + '</a> / ';
		breadcrumbElement += '<a href="/' + country + '/' + region + '/' + city + '">' + city + '</a> / ' ;
		breadcrumbElement += '<a href="/' + country + '/' + region + '/' + city + '/' + game + '">' + game + '</a> / ' ;
	} else {
		breadcrumbElement += '<a href="/' + country + '/' + city + '">' + city + '</a> / ' ;
		breadcrumbElement += '<a href="/' + country + '/' + city + '/' + game + '">' + game + '</a>' ;
	}
	
	webpage = webpage.replace('!%BREADCRUMB%!', breadcrumbElement);
	
	return webpage;
}
module.exports.breadcrumb = breadcrumb;
