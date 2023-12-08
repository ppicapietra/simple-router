class RouterError extends Error {

	static get Status() {
    return {
      NOT_FOUND: 404,
      UNAUTHORIZED: 401,
      FORBIDDEN: 403,
      INTERNAL_SERVER_ERROR: 500,
      REDIRECTION_ERROR: 301
    };
  }

	constructor(statusCode, message) {
		super(message);
		this.statusCode = statusCode;
	}
}

// 404: Not Found
class RouterErrorNotFound extends RouterError {
  constructor() {
    super(RouterError.Status.NOT_FOUND, 'The requested resource was not found');
  }
}

// 301: Not Found
class RouterErrorRedirection extends RouterError {
  constructor() {
    super(RouterError.Status.REDIRECTION_ERROR, 'Redirecting...');
  }
}

// 500: Internal error
class RouterErrorInternalError extends RouterError {
  constructor() {
    super(RouterError.Status.INTERNAL_SERVER_ERROR, 'Internal error');
  }
}