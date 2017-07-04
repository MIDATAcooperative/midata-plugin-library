var midata = angular.module('midata', []);
midata.factory('midataServer', [ '$http', '$q', function($http, $q) {
	
	var service = {};
	
	var actionDef = $q.defer();
	var actionChain = actionDef.promise;
	actionDef.resolve();	
	var domain = function(url) {
   	   if (!url || url=="localhost") return "localhost";
	   return url.split("/")[2].split(":")[0];
	}
	
	var host = window.location.hostname || "localhost";
	var isDebug = window._baseurl !== undefined && window._baseurl !== "http://localhost:9001";
	 	
	var baseurl =  !window._baseurl ? ("https://"+((host == "localhost") ? domain(document.referrer) : host)) : window._baseurl;
	if (baseurl == "https://localhost") baseurl = "https://localhost:9000"; 
	console.log(baseurl);
	var debug = function(name, fkt) {
		return function() {
			console.log("call", name, [].slice.apply(arguments).slice(1));
			var result = fkt.apply(this, arguments);
			if (result && result.then) {			  
			  result.then(function(r) {
				console.log("success["+r.status+"]", name, r.data);
			  }, function(r) {				 
			    console.log("fail["+r.status+"]", name, r.data);
			  });
			} 
			return result;
		};
	}; 
	
	/**
	 * Save a new record on the MIDATA platform
	 */
	service.createRecord = function(authToken, meta, data, id) {
		
		var data = {
			"authToken": authToken,
			"data": angular.toJson(data)
		};
		angular.forEach(meta, function(v,k) { data[k] = v; });
		if (id) data._id = id;
		
		
		var f = function() { return $http.post(baseurl + "/v1/plugin_api/records/create", data); };
		actionChain = actionChain.then(f);	
		return actionChain;
	};
	
	/**
	 * Update an existing record on the MIDATA platform
	 */
	service.updateRecord = function(authToken, id, version, data) {
		
		var data = {
			"authToken": authToken,
			"_id" : id,
			"version" : version,
			"data": angular.toJson(data)
		};
				
		
		var f = function() { return $http.post(baseurl + "/v1/plugin_api/records/update", data); };
		actionChain = actionChain.then(f);	
		return actionChain;
	};
		
	/**
	 * Retrieve stored Records from MIDATA. See developer guide for possible parameters.
	 */
	service.getRecords = function(authToken, properties,fields) {
		 var data = { "authToken" : authToken, "properties" : properties, fields : fields };		
		 return $http.post(baseurl + "/v1/plugin_api/records/search", data);
	};
	
	/**
	 * Get summary of records. See developer guide
	 */
	service.getSummary = function(authToken, level, properties, fields) {
		 var data = { "authToken" : authToken, "properties" : ( properties || {} ), "summarize" : level.toUpperCase(), "fields" : (fields || [])  };		
		 return $http.post(baseurl + "/v1/plugin_api/records/summary", data);
	};
	
	/**
	 * Get configuration stored for current plugin
	 */
	service.getConfig = function(authToken) {
		 var data = { "authToken" : authToken  };		
		 return $http.post(baseurl + "/v1/plugin_api/config/get", data);
	};
	
	/**
	 * Get surplus parameters returned from OAuth authentication
	 */
	service.getOAuthParams = function(authToken) {
		 var data = { "authToken" : authToken  };		
		 return $http.post(baseurl + "/v1/plugin_api/oauth/get", data);
	};
	
	/**
	 * Store configuration for current plugin
	 */
	service.setConfig = function(authToken, config, autoimport) {
		 var data = { "authToken" : authToken, "config" : config  };
		 if (autoimport !== undefined) data.autoimport = autoimport;
		 return $http.post(baseurl + "/v1/plugin_api/config/set", data);
	};
	
	/**
	 * Clone this plugin instance with changed configuration and name
	 */
	service.cloneAs = function(authToken, name, config) {
		 var data = { "authToken" : authToken, "name" : name, "config" : config };		
		 return $http.post(baseurl + "/v1/plugin_api/clone", data);
	};
	
	/**
	 * Lookup coding information on server
	 */
	service.searchCoding = function(authToken, properties, fields) {
		 var data = { "authToken" : authToken, "properties" : properties, "fields" : fields };		
		 return $http.post(baseurl + "/v1/plugin_api/coding/search", data);
	};
	
	/**
	 * Lookup content type information on server
	 */
	service.searchContent = function(authToken, properties, fields) {
		 var data = { "authToken" : authToken, "properties" : properties, "fields" : fields };		
		 return $http.post(baseurl + "/v1/plugin_api/content/search", data);
	};
	
	/**
	 * Execute OAuth2 GET request on target server using MIDATA authorization
	 */
	service.oauth2Request = function(authToken, url) {	
		var data = { "authToken": authToken, "url": url };		
	
	    return $http.post(baseurl + "/v1/plugin_api/request/oauth2", data);
	};
	
	/**
	 * Execute OAuth1 GET request on target server using MIDATA authorization
	 */
	service.oauth1Request = function(authToken, url) {	
		var data = { "authToken": authToken, "url": url };		
	
	    return $http.post(baseurl + "/v1/plugin_api/request/oauth1", data);
	};
	
	/**
	 * Uses FHIR API to create a resource
	 */
	service.fhirCreate = function(authToken, resource) {						
	    return $http({
	    	method : "POST",
	    	url : baseurl + "/fhir/"+resource.resourceType,
	    	headers : { "Authorization" : "Bearer "+authToken , "Prefer" : "return=representation" },
	    	data : resource
	    });
	};
	
	/**
	 * Uses FHIR API to update a resource
	 */
	service.fhirUpdate = function(authToken, resource) {
		return $http({
			method : "PUT",
			url : baseurl + "/fhir/"+resource.resourceType+"/"+resource.id,
			headers : { "Authorization" : "Bearer "+authToken, "Prefer" : "return=representation" },
	    	data : resource
		});
	};
	
	/**
	 * Uses FHIR READ or VREAD (if version given)
	 */
	service.fhirRead = function(authToken, resourceType, id, version) {						
	    return $http({
	    	method : "GET",
	    	url : baseurl + "/fhir/"+resourceType+"/"+id+(version !== undefined ? "/_history/"+version : ""),
	    	headers : { "Authorization" : "Bearer "+authToken }
	    });
	};
	
	/**
	 * Uses FHIR SEARCH
	 */
	service.fhirSearch = function(authToken, resourceType, params) {						
	    return $http({
	    	method : "GET",
	    	url : baseurl + "/fhir/"+resourceType,
	    	headers : { "Authorization" : "Bearer "+authToken },
	    	params : params	    	
	    });
	};
		
	
	/**
	 * Use FHIR batch or transaction
	 */
	service.fhirTransaction = function(authToken, bundle) {							    	   
	    var f = function() { 
	    	return $http({
		    	method : "POST",
		    	url : baseurl + "/fhir",
		    	headers : { "Authorization" : "Bearer "+authToken },
		    	data : bundle	    	
		    }); 
	    };
		actionChain = actionChain.then(f);	
		return actionChain;
	};
	
	service.run = function(authToken) {	
		var data = { "authToken": authToken  };		
	    return $http.post(baseurl + "/v1/plugin_api/run", data);
	};
	
	/**
	 * Retrieve an unused record id from server
	 */
	service.newId = function(authToken) {	
		var data = { "authToken": authToken  };		
	    return $http.post(baseurl + "/v1/plugin_api/records/newId", data);
	};
	
	service.baseurl = baseurl;
	
	if (isDebug) {
		service.createRecord = debug("createRecord", service.createRecord);
		service.updateRecord = debug("updateRecord", service.updateRecord);			
		service.getRecords = debug("getRecords", service.getRecords);
		service.getSummary = debug("getSummary", service.getSummary);
		service.getConfig = debug("getConfig", service.getConfig);		
		service.getOAuthParams = debug("getOAuthParams", service.getOAuthParams);			 
		service.setConfig = debug("setConfig", service.setConfig);
		service.cloneAs = debug("cloneAs", service.cloneAs);
		service.searchCoding = debug("searchCoding", service.searchCoding);
		service.searchContent = debug("searchContent", service.searchContent);
		service.oauth2Request = debug("oauth2Request", service.oauth2Request);
		service.oauth1Request = debug("oauth1Request", service.oauth1Request);
		service.fhirCreate = debug("fhirCreate", service.fhirCreate);
		service.fhirRead = debug("fhirRead", service.fhirRead);
		service.fhirUpdate = debug("fhirUpdate", service.fhirUpdate);	
		service.fhirSearch = debug("fhirSearch", service.fhirSearch);
		service.fhirTransaction = debug("fhirTransaction", service.fhirTransaction);		
		service.newId = debug("newId", service.newId);
	}
	
	return service;	
}]);
midata.factory('midataPortal', [ '$window', '$location', '$interval', function($window, $location, $interval) {
	
	var service = {};
	var height = 0;
	
	/**
	 * automatically resize view in portal to fit plugin content
	 */
	service.autoresize = function() {		
		$window.setInterval(function() { service.resize(); return true; }, 300);
	};
	
	/**
	 * manually resize view in portal to fit plugin content
	 */
	service.resize = function() {		
		var newheight = $window.document.documentElement.offsetHeight+"px";
		
		if (newheight !== height) {				  
		  $window.parent.postMessage({ type: "height", name:window.name, viewHeight : newheight }, "*");		
		  height = newheight;
		}
	};
	
	/**
	 * open link with URL of current plugin in new view in portal.
	 */
	service.openLink = function(pos, url, params) {
		$window.parent.postMessage({ type: "link", name:window.name, url:url, pos:pos, params:params }, "*");
	};
	
	/**
	 * open link to different app in new view in portal.
	 */
	service.openApp = function(pos, app, params) {
		$window.parent.postMessage({ type: "link", name:window.name, app:app, pos:pos, params:params }, "*");
	};
	
	/**
	 * change default button target of portal button
	 */
	service.setLink = function(func, pos, url, params) {
		$window.parent.postMessage({ type: "set", name:window.name, func:func , url:url, pos:pos, params:params }, "*");
	};
	
	/**
	 * Notify portal that view can be closed
	 */
	service.doneNotification = function() {
		$window.parent.postMessage({ type: "close", name:window.name }, "*");
	};
	
	/**
	 * Notify portal that data has changed
	 */
	service.updateNotification = function() {
		$window.parent.postMessage({ type: "update", name:window.name }, "*");
	};
	
	/**
	 * Language chosen by user in portal
	 */
	service.language = $location.search().lang || 'en';
	
	/**
	 * Logged in user
	 */
	service.owner = $location.search().owner;
	
	return service;
}]);
