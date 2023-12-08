class Route {
  /**
   * 
   * prop views structure => {
   *    "container-name@route.name": {
   *        template: "template/path/name",
   *        controller: "functionController"
   *    }
   * }
   */
  constructor( { name, url, params = {}, controller = null, views = {}, parent = null, abstract = false } ) {
    this.name = name;
    this.url = url;
    this.controller = controller;
    this.views = views;
    this.params = params;
    this.parent = parent;
    this.abstract = abstract;
  }

  /**
  
  Merges the passed params object with the current params object of the Route instance.
  The properties of the params object that match an existing property of the current params
  object will overwrite the existing value of that property.
  @param {Object|Object[]} params - The object or array of objects containing the new parameter values to be merged.
  @returns {Route} Route with params merged
  */
  mergeParams( params ) {
    Object.assign( this.params, ...params );
    return this;
  }
}