/**
 * 
 * @param {string} host URL to the main script project
 * @param {function} fileAccessor callback function to get the files raw content
 * @param {Object} logger an instance of SimpleLogger
 * 
 * @returns {Object} SimpleRouter instance
 */
function config( { host = 'localhost', fileAccessor, logger } ) {

	Config_.getFileContent = fileAccessor;
	Config_.APP_HOST_ = host;
	Config_.Logger = logger;

	return this;
}

/**
Adds a new Route object to the Config_.routes array based on the provided parameters.
@param {string} name - The name of the route.
@param {object} options - The options object containing properties of the Route object.
@param {string} options.url - The URL path of the route after his parent.
@param {object} options.params - An object containing key-value pairs of parameters to be passed to the route.
@param {function} options.controller - The controller function to be called when the route is matched.
@param {string} options.parent - The name of the parent route, if any.
@returns {object} - The SimpleRouter instance.
*/
function route( name, { url, params, views, controller, abstract } ) {
	let props = {
		name: name,
		url: url || undefined,
		params: params || undefined,
		views: views || undefined,
		controller: controller || undefined,
		abstract: abstract || undefined,
	};

	let nameParts = name.split( "." );
	if ( nameParts.length > 1 ) {
		let parentName = nameParts.slice( 0, -1 ).join( "." );
		props.parent = getRouteByName_( parentName );
	}

	let route = new Route( props )

	Config_.routes.push( route )
	return this;
}

/**
 * Returns the URL string for use on a href attribute constructed from the route object.
 *
 * @param {Route} route - The route object.
 * @returns {string} The URL string constructed from the route object.
 */
function link( routePathOrName ) {
	let route;
	if (routePathOrName.startsWith("/")) {
		route = getRouteByPath_( routePathOrName );
	}
	else {
		route = getRouteByName_( routePathOrName );
	}
	const fullPath = getRoutefullPath_( route );
	return `${ Config_.APP_HOST_ }/${ fullPath }`;
}

function renderRequest( request ) {

	let [ path, queryParams ] = [request.pathInfo, request.parameters];

	normalizeQueryString_(queryParams);

	try {
		let route = getRouteByPath_( path, queryParams );

		if ( path.startsWith( API_PREFIX_URL ) ) {
			return renderRouteToJson_( route );
		}
		else {
			const responseContent = renderRouteToHtml_( route );
			return responseContent.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
		}
	} catch ( error ) {
		if ( error && ( error.status || error.message ) ) {
			throw new RouterError( error.status ?? RouterError.Status.INTERNAL_SERVER_ERROR, error.message ?? "Internal error" );
		}
		else {
			throw new RouterErrorInternalError();
		}
	}
}

// ALIASES for templates

function sr_include( filename ) {
  return Config_.getFileContent( filename );
}