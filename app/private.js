const ExternaLogger = ( function () {
  return Config_.Logger;
} )();

function logger( description, type = 'info' ) {
  if ( Config_.Logger ) {
    Config_.Logger.add( description, type );
  }
}

function normalizeQueryString_( params ) {

  Object.keys( params ).forEach( paramKey => { Array.isArray( params[ paramKey ] ) && params[ paramKey ].length === 1 && ( params[ paramKey ] = params[ paramKey ][ 0 ] ) } )

  return params;
}

/**
 * Returns the route object with the specified name.
 *
 * @param {string} routeName - The name of the route to retrieve.
 * @returns {Route} The route object with the specified name.
 */
function getRouteByName_( routeName ) {
  const route = Config_.routes.find( r => r.name === routeName );
  return route || null;
}

/**
 * Gets a route object based on the given request path.
 * @param {string} requestPath - The request path to match against.
 * @returns {Route|null} The matching route object, or null if no match was found.
 */
function getRouteByPath_( requestPath, queryString = null ) {
  if ( !requestPath ) throw new RouterErrorNotFound();

  let queryParams = normalizeQueryString_( queryString );
  let requestUrlParts = requestPath.split( "/" );
  let routeFound = null;

  for ( let route of Config_.routes ) {

    let routeFullPath = getRoutefullPath_( route );
    let routeParts = routeFullPath.split( "/" );

    if ( routeParts.length != requestUrlParts.length ) continue;

    if ( routeParts.every( ( e, i ) => {
      return e == requestUrlParts[ i ] || ( e.startsWith( ":" ) && requestUrlParts[ i ] )
    } ) ) {
      let params = {}
      routeParts.forEach( ( e, i ) => {
        if ( e.startsWith( ":" ) ) {
          let paramName = e.slice( 1 );
          let paramValue = requestUrlParts[ i ];
          params[ paramName ] = paramValue;
        }
      } )
      route.mergeParams( [ queryParams, params ] );
      routeFound = route;
      break;
    }
  }

  if ( !routeFound ) throw new RouterErrorNotFound();

  return routeFound;
}

/**
Recursively constructs the full URL of a route by appending its parent's URL.
@param {Route} route - The Route object to get the full URL for.
@returns {string} - The full URL of the route.
*/
function getRoutefullPath_( route ) {
  let fullPath = route.url;
  let parentRoute = route.parent;
  while ( parentRoute ) {
    if ( !parentRoute.abstract ) {
      fullPath = `${ parentRoute.url }${ fullPath }`;
    }
    parentRoute = parentRoute.parent;
  }

  if ( fullPath.startsWith( "/" ) ) {
    fullPath = fullPath.slice( 1 );
  }
  return fullPath;
}

/**
 * 
 * @param {*} templateContent 
 * @returns {string} HTML with directives processed
 */
function processComponents( templateContent ) {

  function parseComponentProperties( propertiesString ) {
    const regexProperties = /(\w+)=["]([^"]*)["]/g;
    let match;
    const parsedProperties = {};

    // Itera sobre todas las coincidencias de propiedades
    while ( ( match = regexProperties.exec( propertiesString ) ) !== null ) {
      const propName = match[ 1 ];
      const propValue = match[ 2 ];
      // Asigna el valor de la propiedad al objeto de propiedades
      parsedProperties[ propName ] = propValue;
    }

    return parsedProperties;
  }

  // Regular expression to match custom components including scriptlets within attributes
  const customTagRegex = /<x-([\w.-]+)((?:\s+\w+=(?:"[^"]*"|'[^']*'|<\?!=.*?\?>))*\s*)(?:>(.*?)<\/x-\1>|\/>)/g;

  // Function to process and replace an individual component
  function processSingleComponent( match, componentName, propertiesString, slotContent ) {
    // Parse the component's properties
    const componentProperties = parseComponentProperties( propertiesString );

    // Get the path and content of the component's template
    const templatePath = componentName.replace( /\./g, '/' );
    const normalizedTemplatePath = `${ COMPONENTS_FOLDER_PREFIX }${ templatePath }`;
    let templateFetchedContent = Config_.getFileContent( normalizedTemplatePath );

    // If there is slot content, process it first to handle nested components
    if ( slotContent ) {
      slotContent = processComponents( slotContent );
    }

    // Replace '{{slot}}' in the component's template with the processed content
    templateFetchedContent = templateFetchedContent.replace( '{{slot}}', slotContent || '' );

    // Create and evaluate the component template with the parsed properties
    const componentTemplate = HtmlService.createTemplate( templateFetchedContent );
    Object.assign( componentTemplate, componentProperties );
    const evaluatedComponent = componentTemplate.evaluate().getContent();

    // Recursively process any additional components in the evaluated template
    if ( evaluatedComponent.match( customTagRegex ) ) {
      return processComponents( evaluatedComponent );
    }

    return evaluatedComponent;
  }

  // Replace all components in the template content
  return templateContent.replace( customTagRegex, processSingleComponent );
}

/**
   * 
   * @param {Route} route 
   * @param {Object} hierarchy routes with their names as keys
   * @returns {Object[]} hierarchy routes with their names as keys
   */
function getNestedRoutes_( route, hierarchy = [] ) {

  if ( route.parent ) {
    getNestedRoutes_( route.parent, hierarchy );
  }

  hierarchy.push( route );


  return hierarchy;
}

/**
 * 
 * @param {Route} route 
 * @returns {GoogleAppsScript.HTML.HtmlOutput} renderized route to return to user UI
 */
function renderRouteToHtml_( route ) {

  function getPreCompiledRoutesAndViews( route ) {
    let routesWithCompiledViews = {};

    let routesInPath = getNestedRoutes_( route );
    let tempRoutesInPath = [ ...routesInPath ];

    let currentRoute;
    while ( tempRoutesInPath.length > 0 ) {
      currentRoute = tempRoutesInPath.pop();
      // for each route
      routesWithCompiledViews[ currentRoute.name ] = {};

      for ( const [ viewName, view ] of Object.entries( currentRoute.views ) ) {
        let $$scope_ = {};

        // if this view has a controller
        if ( view.controller ) {
          let callParams = {
            scope: $$scope_,
            params: Object.assign( {}, currentRoute.params )
          }
          view.controller( callParams );
        }

        // compiling view

        let viewRawContent = Config_.getFileContent( view.template );
        let viewWithComponents = processComponents( viewRawContent );
        let templateView = HtmlService.createTemplate( viewWithComponents );
        Object.assign( templateView, $$scope_ );
        let compiledView = templateView.evaluate().getContent();

        routesWithCompiledViews[ currentRoute.name ][ viewName ] = compiledView;
      }
    }

    return routesWithCompiledViews
  }

  function compileViews( routes ) {
    let preliminarFinalTemplateHtml = Config_.getFileContent( BASE_HTML_TEMPLATE );
    let preliminarFinalTemplate = HtmlService.createTemplate( preliminarFinalTemplateHtml );
    preliminarFinalTemplate.APP_HOST_ = Config_.APP_HOST_;

    let finalTemplateHtml = preliminarFinalTemplate.evaluate().getContent();
    // first one we get is the more nested level
    for ( const [ currentRouteName, currentRouteViews ] of Object.entries( routes ) ) {

      for ( const [ currentRouteViewName, currentRouteView ] of Object.entries( currentRouteViews ) ) {
        const [ containerId, parentRouteName ] = currentRouteViewName.split( '@' );
        if ( !parentRouteName || parentRouteName !== currentRouteName ) {
          continue;
        }
        const placeholderViewRegex = new RegExp( `<div\\s+sr-view=("${ containerId }"|'${ containerId }')><\/div>` );

        for ( let [ localRouteViewName, localRouteView ] of Object.entries( currentRouteViews ) ) {
          if ( placeholderViewRegex.test( localRouteView ) ) {
            localRouteView = localRouteView.replace( placeholderViewRegex, currentRouteView );
            break; // finish the local replacement process
          }
        }
      }

      for ( const [ currentRouteViewName, currentRouteView ] of Object.entries( currentRouteViews ) ) {
        const [ containerId, parentRouteName ] = currentRouteViewName.split( '@' );

        let parentViews = parentRouteName ? routes[ parentRouteName ] : null;

        if ( parentViews ) {
          const placeholderViewRegex = new RegExp( `<div\\s+sr-view=("${ containerId }"|'${ containerId }')><\/div>` );

          for ( let [ parentViewName, parentView ] of Object.entries( parentViews ) ) {
            if ( placeholderViewRegex.test( parentView ) ) {
              parentView = parentView.replace( placeholderViewRegex, currentRouteView );
              break; // finish the local replacement process
            }
          }
        }
      }

      // If the route is in the final line of ancestors
      if ( !route.parent && route.views && route.views.app ) {
        const placeholderViewRegex = new RegExp( `<div\\s+sr-view=("${ BASE_TEMPLATE_VIEW_ID }"|'${ BASE_TEMPLATE_VIEW_ID }')><\/div>` );
        finalTemplateHtml = finalTemplateHtml.replace( placeholderViewRegex, routes[ currentRouteName ].app );
        break;
      }
    }

    return finalTemplateHtml;
  }

  let compiledHtml;

  let routes = getPreCompiledRoutesAndViews( route );
  compiledHtml = compileViews( routes );

  let compiledTemplate = HtmlService.createTemplate( compiledHtml ).evaluate();

  return compiledTemplate;
}

function renderRouteToJson_( route ) {

  let $$scope_ = {};
  let response = {
    code: 200,
    message: "ok",
    data: {}
  };

  let callParam = {
    scope: $$scope_,
    params: route.params
  }
  try {
    route.controller( callParam );
    Object.assign( response.data, $$scope_ );
  } catch ( error ) {
    response = {
      code: error.code ?? RouterError.Status.INTERNAL_SERVER_ERROR,
      message: error.message ?? 'Internal error',
      data: {}
    }
  }

  return ContentService.createTextOutput( JSON.stringify( response ) )
    .setMimeType( ContentService.MimeType.JSON );
}