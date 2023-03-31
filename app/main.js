/**

Adds a new Route object to the Routes_ array based on the provided parameters.
@param {string} name - The name of the route.
@param {object} options - The options object containing properties of the Route object.
@param {string} options.url - The URL path of the route.
@param {object} options.params - An object containing key-value pairs of parameters to be passed to the route.
@param {function} options.handler - The handler function to be called when the route is matched.
@param {string} options.template - The template to be rendered when the route is matched.
@param {string} options.parent - The name of the parent route, if any.
@returns {object} - The SimpleRouter instance.
*/
function route(name, { url, params, handler, template, parent }) {
  let props = {
    name: name,
    url: url || undefined,
    params: params || undefined,
    handler: handler || undefined,
    template: template || undefined
  };

  let nameParts = name.split(".");
  if (nameParts.length > 1) {
    let parentName = nameParts.slice(0, -1).join(".");
    props.parent = parentName;
  }

  let route = new Route(props)

  Routes_.push(route);
  return this;
}

/**
 * Gets a route object based on the given request path.
 * @param {string} requestPath - The request path to match against.
 * @returns {object|null} The matching route object, or null if no match was found.
 */
function getRouteByPath(requestPath) {
  let requestUrlParts = requestPath.split("/");

  for (let route of Routes_) {

    let routeWithFullUrl = getRouteByName(route.name);
    let routeParts = routeWithFullUrl.url.split("/");

    if (routeParts.length != requestUrlParts.length) continue;

    if (routeParts.every((e, i) => {
      return e == requestUrlParts[i] || (e.startsWith(":") && requestUrlParts[i])
    })) {
      return routeWithFullUrl;
    }
  }

  return null;
}

/**
 * Returns the route object with the specified name.
 *
 * @param {string} routeName - The name of the route to retrieve.
 * @returns {Object} The route object with the specified name.
 */
function getRouteByName(routeName) {
  const route = Routes_.find(r => r.name === routeName);
  if (!route) return null;

  let currentRoute = route;
  let ancestorNames = routeName.split('.').slice(0, -1);
  let ancestorUrls = [];

  let ancestorsLength = ancestorNames.length;

  if (ancestorsLength >= 1) {
    for (let i = 1; i <= ancestorsLength; i++) {
      console.log("i", i);
      const ancestorRoute = Routes_.find(r => r.name === ancestorNames.slice(0, i).join("."));
      if (!ancestorRoute) break;

      ancestorUrls.push(ancestorRoute.url);
    }
  }
  currentRoute.url = `${ancestorUrls.join('')}${currentRoute.url}`;
  if (currentRoute.url.startsWith("/")) {
    currentRoute.url = currentRoute.url.slice(1);
  }

  return currentRoute;
}

/**
 * Returns the URL string constructed from the route object.
 *
 * @param {Object} route - The route object.
 * @returns {string} The URL string constructed from the route object.
 */
function getUrlFromRoute(route) {
  return `${Config.HOST}/${route.url}`;
}

/**
 * Executes the handler function for a given route with the provided parameters,
 * and renders the HTML result.
 *
 * @param {Route} route - The route object containing the handler function to execute and any necessary parameters.
 * @throws {Error} - If the execution of the handler function results in an error.
 */
function renderHTML(route) {

  if (route.handler) {
    let callParam = {
      scope: $$routerScope_,
      params: Object.assign({}, route.params)
    }
    try {
      let handlerFn = new Function(`return (${route.handler})`)();
      handlerFn(callParam);
    }
    catch (error) {
      throw (error)
    }
  }

  // render
  var template = HtmlService.createTemplateFromFile(route.template);

  Object.assign(template, $$routerScope_);

  try {
    let html = template.evaluate().getContent();
    return HtmlService.createHtmlOutput(html);
  }
  catch (error) {
    throw (error);
  }
}

/**
 * Renders JSON output based on the provided route's handler function and parameters.
 *
 * @param {Route} route - The route object to render JSON output for.
 * @returns {ContentService} The JSON output in text format.
 * @throws {Error} If there's an error executing the route's handler function.
 */
function renderJSON(route) {
  let callParam = {
    params: route.params
  }
  try {
    let handlerFn = new Function(`return (${route.handler})`)();
    let result = handlerFn(callParam);
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  catch (error) {
    throw (error);
  }
}