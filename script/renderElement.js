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

function posts(webpage, country, region, posts) {
	var YOUTUBELINK_SEARCH = "https://www.youtube.com/watch?";

	var postElement = '<dl>';
  posts.forEach(function(post) {
    var youtubeLinkStart = post.message.indexOf(YOUTUBELINK_SEARCH);
		if (youtubeLinkStart != -1) {
			youtubeLinkEnd = post.message.indexOf(" ", youtubeLinkStart);

			if (youtubeLinkEnd == -1) {
				youtubeLinkEnd = post.message.length;
			}

			while(post.message.substr(youtubeLinkStart, youtubeLinkEnd) == '.') {
				youtubeLinkEnd--;
			}

			var youtubeEmbedded = post.message.substr(youtubeLinkStart, youtubeLinkEnd);
			youtubeEmbedded = youtubeEmedded.replace('watch?v=' ,'embed/');

			youtubeEmbedded = '<div class="embed-responsive embed-responsive-16by9"><iframe class="col-sm-6" frameborder="0" allowfullscreen src="' + youtubeEmbedded;
			youtubeEmbedded += '"></iframe></div>';

			post.message = post.message.substring(0,youtubeLinkStart) + youtubeEmedded + post.message.substring(youtubeLinkEnd);
		}

		var adjustedDateTime = getGmtAdjustedDateTime(post.submissionDate, country, region);
		postElement += '<dt>' + post.title + '</dt>' +
    '<dd>&nbsp;&nbsp;&nbsp;- ' + post.message + '</dd><br/>' +
    '<dd>&nbsp;&nbsp;&nbsp;- ' + post.username + ', ' +  dateFormat(adjustedDateTime, "mmmm dS, yyyy, h:MM:ss TT") + '</dd><br/>';
  });
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
		element += '<li><a href="' + url + 'updateprofile">Update Profile</a></li>';
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

function activities(webpage, titlelist, gamelist, citylist, regionlist, countrylist, descriptionlist, linklist, numberofplayerslist) {
	var activityElement = '<div class="list-group">\n';
	var badgetype = 'badge-default';

	for(var i = 0; i < titlelist.length; i++) {
		var numberofplayers = parseInt(numberofplayerslist[i]);

		if (numberofplayers == 0) {
			badgetype = 'badge-default';
		} else if (numberofplayers > 0) {
			badgetype = 'badge-primary';
		} else if (numberofplayers > 5) {
			badgetype = 'badge-success';
		} else if (numberofplayers > 10) {
			badgetype = 'badge-danger';
		} else {
			badgetype = 'badge-default';
		}

		activityElement += '\t<a href="' + linklist[i] + '" class="list-group-item list-group-item-action flex-column align-items-start">\n';
		activityElement += '\t\t<div class="d-flex w-100 justify-content-between">\n';
		activityElement += '\t\t\t<h5 class="mb-1">' + titlelist[i] + ' | \n';
		activityElement += '\t\t\t\t<small class="text-muted">' + citylist[i] + '</small>\n';
		activityElement += '\t\t\t\t<span class="badge badge-pill ' + badgetype + '">' + numberofplayerslist[i] + '</span>\n';
		activityElement += '\t\t\t</h5>\n';
		activityElement += '\t\t</div>\n';
		activityElement += '\t<p class="mb-1">' + descriptionlist[i] + '</p>\n';
		activityElement += '\t</a>\n';
	}

	activityElement += '</div>';

	webpage = webpage.replace('!%ACTIVITYLIST%!', activityElement);

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
	var breadcrumbElement = '<a href="/">Home</a>';

	var url = '/' + country;
	breadcrumbElement += ' / <a href="' + url + '">' + country + '</a>';

	if (region) {
		url += '/' + region;
		breadcrumbElement += ' / <a href="' + url + '">' + region + '</a>';
	}

	if (city) {
		url += '/' + city;
		breadcrumbElement += ' / <a href="' + url + '">' + city + '</a>';
	}

	if (game) {
		url += '/' + game;
		breadcrumbElement += ' / <a href="' + url + '">' + game + '</a>';
	}

	webpage = webpage.replace('!%BREADCRUMB%!', breadcrumbElement);

	return webpage;
}
module.exports.breadcrumb = breadcrumb;

function mainheading(webpage, isLogin, username) {
	var heading = '';

	if(isLogin) {
		heading = '<form action="/login">\n';
		heading += '\t<div class="btn-group">\n';
		heading += '\t\t<input type="submit" value="Login" class="btn btn-default btn-primary"/>\n';
		heading += '\t</div>\n';
		heading += '</form>\n';
	} else {
		heading = 'Welcome ' + username;
	}

	webpage = webpage.replace('!%MAINHEADING%!', heading);

	return webpage;
}
module.exports.mainheading = mainheading;
