# README

## Purpose

The purpose of this library is to provide a simple router with functionality similar to AngularJS's UIRouter. It allows for the definition of a hierarchically nested array of routes, with predefined parameters for each, as well as their own controllers and templates.

## Import Library into App Script Project

1) Open your Google Apps Script project and click on "Resources" in the menu bar.
2) Select "Libraries" and in the "Add a library" field, enter the following script ID: `1D2piH4IpAg3UExxOpIZE0fbCeBqmAyHjpIl4hcdc0RkEMrL5d9IQLnzN`
3) Choose the latest version and select "Save".
4) In your code, you can now use the SimpleRouter object to create and manage your routes.

## Configuration

To start using SimpleRouter, configure it with the base host URL and a callback function to retrieve raw template content.

```javascript
SimpleRouter.config('https://your-script-url', getTemplateContent);
```

`getTemplateContent` should be a function that returns the raw HTML content of a template.
Replace `https://your-script-url` with your actual Google Apps Script Web App URL

## Defining Web Routes

Define routes by creating instances of the `Route` class.

```javascript
SimpleRouter.route({
  name: 'home',
  url: '/',
  views: {
    "container-name@route-name": {
      template: "template/path/home",
      controller: homeController
    }
  }
});
```

## Defining API Routes

Define API routes by creating instances of the `Route` class as child of api parent route.

```javascript
SimpleRouter.route({
  name: 'api',
  url: '/api'
})
.route({
  name: 'api.tasks',
  url: '/tasks',
  controller: taskController
});
```

### Route Parameters

When defining a new route, you can configure the following parameters:

- `name`: A unique string identifier for the route.
- `url`: The URL path associated with the route. Must start with `/`.
- `views`: An object defining the views. Each key represents a view's name and its placement, structured as "containerID@parentRouteName". If the route is a root route, "app" is used for the key to indicate that the view is the one inserted on the base index tempkate.
- `params`: (Optional) An object containing default parameters for the route.
- `abstract`: (Optional, Default = false) Define if the route url value is included in full path obtained were it is involved.

### View Names Structure

The view names within the `views` object follow a specific structure:

- `"containerID@parentRouteName"`: This indicates that the view should be placed within the `containerID` element of the `parentRouteName` route's template. If there's no parent route, the key should be `"app"` indicating that the view is to be rendered in the base template.

### View object Structure

The view objects within the `views` object follow a specific structure:

```javascript
{
  template: 'path/to/template',
  controller: functionController
}
```

## View controller

Controllers are functions that process the request and return data to be rendered in the template.

```javascript
function homeController(params, scope) {
  // Logic to handle the home route
}
```

- `params`: An object containing route parameters.
- `scope`: An object that is used to pass data to the template.

## Components

You can include components in templates. Every component can receive properties that later will be used to replace values in scriplets inside the component template.
An example of this could be:

````html
<my-component property_one="value">Content to put inside {{slot}} placeholder</my-component>
<my-component property_one="value"/>
```

## Rendering Routes

To render a route, call `renderRoute` with the desired path URL.

```javascript
SimpleRouter.renderRoute('path/to/route');
```

This will look for the corresponding route and execute its controller, then render the view accordingly.

## Error Handling

`SimpleRouter` throws `RouterErrorNotFound` if a route is not found, and `RouterErrorInternalError` for any internal errors during rendering.

## Complete Example

```javascript
SimpleRouter.config('https://your-script-url', getTemplateContent);

// Define a route
SimpleRouter.route('tasks', {
  url: '/tasks',
  views: {
    "app": {
      template: "template/path/tasks",
      controller: tasksController
    }
  }
})
.route('tasks.list', {
  url: '/list',
  params: {
    var_one: "value"
  }
  views: {
    "container@tasks": {
      template: "template/path/list",
      controller: listHController
    }
  }
});

// controller function
function tasksController(params, scope) {
  // Logic for the tasks route
}

// Render the route
return SimpleRouter.renderRoute('tasks/list');

// Error handling
try {
  return SimpleRouter.renderRoute('/non-existent-route');
} catch (error) {
  // error has code and message properties
  Logger.log(`code: ${error.code}. message: ${error.message}`)
}
```
