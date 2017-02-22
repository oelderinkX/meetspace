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

function activityTitle(webpage, title, day, time) {
  
  webpage = webpage.replace('!%TITLE%!', title + ', ' + getDay(day) + ' ' + getTime(time));
  
  return webpage;
}
module.exports.activityTitle = activityTitle;

function posts(webpage, postdates, postusernames, postmessages) {
	//var postElement = '';
	var postElement = '<dl>';
	for(var i = 0; i < postdates.length; i++) {
		//postElement += '<blockquote><p>' + postmessages[i] + '</p><footer>' + postusernames[i] + ', ' +  dateFormat(postdates[i], "mmmm dS, yyyy, h:MM:ss TT") + '</footer></blockquote>';
		postElement += '<dt>' + postmessages[i] + '</dt><dd>&nbsp;&nbsp;&nbsp;- ' + postusernames[i] + ', ' +  dateFormat(postdates[i], "mmmm dS, yyyy, h:MM:ss TT") + '</dd><br/>';
	}
	postElement += '</dl>';
	
	webpage = webpage.replace('!%POSTS%!', postElement);
	
	return webpage;
}
module.exports.posts = posts;

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
	var activitieElement = '<div class="list-group">';
	
	for(var i = 0; i < titlelist.length; i++) {
		activitieElement += '<a href="' + linklist[i] + '" class="list-group-item list-group-item-action flex-column align-items-start">';
		activitieElement += '<div class="d-flex w-100 justify-content-between">';
		activitieElement += '<h5 class="mb-1">' + titlelist[i] + '</h5>';
		activitieElement += '<small class="text-muted">' + citylist[i] + '</small>';
		activitieElement += '</div>';
		activitieElement += '<p class="mb-1">' + descriptionlist[i] + '</p>';
		activitieElement += '</a>';
	}
	
	activitieElement += '</div>';
	
	webpage = webpage.replace('!%ACTIVITYLIST%!', activitieElement);
	
	return webpage;
}
module.exports.activities = activities;