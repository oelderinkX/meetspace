function getLocation(param, callback) {
	var url = 'http://www.meetspace.co.nz/location?get=';
    var http = new XMLHttpRequest(); // a new request
    http.open('GET' ,url + param,true);
	
	http.onload = function(e) {
		if (http.readyState === 4 && http.status === 200) {
			callback(JSON.parse(http.responseText));
		}
	};
	
	http.send(null);    
}

function setVisibility(element, vStyle) {
	if (element) {
		element.style.visibility = vStyle;
	}
}

function hideElement(element) {
	setVisibility(element, "hidden");
}

function showElement(element) {
	setVisibility(element, "visible");
}

function loadRegion(country) {
	var regioncombo = document.getElementById("regioncombo");

	if (!country) {
		var citycombo = document.getElementById("citycombo");
		var searchbutton = document.getElementById("searchbutton");
		hideElement(citycombohideElement);
		hideElement(searchbutton);
		hideRegionCombo();
		return;
	}
	
	regioncombo.innerHTML = "<div class='input-group-prepend'><label class='input-group-text'>Region</label></div><select id='region' onchange='setRegion()'></select>";
	
	clearRegions();
	var select = document.getElementById("region");
	var idAndCode = country.split(',');
	
	getLocation('regions&id=' + idAndCode[0], function(regions) {
		if(regions) {
			var option = document.createElement('option');
			option.text = "";
			option.value = "";
			select.appendChild(option, 0);		
		
			for(var i = 0; i < regions.length; i++) {
				var option = document.createElement('option');
				option.text = regions[i].name;
				option.value = regions[i].id;
				if (option.text) {
					select.appendChild(option, 0);
				}
			}
			
			select.value = getCookie("region")

			var citycombo = document.getElementById("citycombo");
			var searchbutton = document.getElementById("searchbutton");
			var regioncombo = document.getElementById("regioncombo");
			showElement(citycombo);
			showElement(searchbutton);
			showElement(regioncombo);
		}
	});
}

function loadCity(region) {

	if (!country) {
		var citycombo = document.getElementById("citycombo");
		var searchbutton = document.getElementById("searchbutton");
		hideElement(citycombo);
		hideElement(searchbutton);
		return;
	}
	
	clearCities();
	var select = document.getElementById("city");

	getLocation('cities&id=' +region, function(cities) {
		if(cities) {
			var option = document.createElement('option');
			option.text = "";
			option.value = "";
			select.appendChild(option, 0);		
		
			for(var i = 0; i < cities.length; i++) {
				var option = document.createElement('option');
				option.text = cities[i].name;
				option.value = cities[i].name;
				if (option.text) {
					select.appendChild(option, 0);
				}
			}
			
			select.value = "christchurch"; //use cookie here
			
			var citycombo = document.getElementById("citycombo");
			var searchbutton = document.getElementById("searchbutton");
			showElement(citycombo);
			showElement(searchbutton);
		}
	});
}

function setCountry() {
	var combobox = document.getElementById("country");
	setCookie("country", combobox.value, 30);
	 
	loadRegion(combobox.value);
}

function setRegion() {
	var combobox = document.getElementById("region");
	setCookie("region", combobox.value, 30);

	loadCity(combobox.value);
}

function clearRegions() {
	var select = document.getElementById("region");
	
	while (select.firstChild) {
		select.removeChild(select.firstChild);
	}
}

function clearCities() {
	var select = document.getElementById("city");
	
	while (select.firstChild) {
		select.removeChild(select.firstChild);
	}
}

function hideRegionCombo() {
	var regioncombo = document.getElementById("regioncombo");
	regioncombo.innerHTML = "";
}