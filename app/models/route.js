class Route {
  constructor({ name, url, params = {}, handler = null, template = null, parent = null }) {
    this.name = name;
    this.handler = handler;
    this.url = url;
    this.template = template;
    this.params = params;
    this.parent = parent;
  }

  mergeParams(params) {
    Object.assign(this.params, params);
  }
}