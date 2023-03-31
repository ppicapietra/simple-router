class Route {
  constructor( { name, url, params = {}, handler = null, template = null, parent = null } ) {
    this.name = name;
    this.handler = handler;
    this.url = url;
    this.template = template;
    this.params = params;
    this.parent = parent;
  }

  /**
  
  Merges the passed params object with the current params object of the Route instance.
  The properties of the params object that match an existing property of the current params
  object will overwrite the existing value of that property.
  @param {Object} params - The object containing the new parameter values to be merged.
  @returns {Route} Route with params merged
  */
  mergeParams( params ) {
    Object.assign( this.params, params );
    return this;
  }
}