const OK = 200;
const NOT_FOUND = 404;
const NO_CONTENT = 204;
const BAD_REQUEST = 400;

const BODIES = {
  204: null,
  200: '200 OK',
  404: '404 Not Found',
  400: 'Request body is missing or params are incorrect',
};

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': 86400,
};

const HEADERS = {
  ...CORS,
  'Content-Type': 'application/json; charset=UTF-8',
};

const R = {
  krakenfiles: 'https?://(?:www.)?krakenfiles.com/view/(?<id>[^/&?]+)',
  webshare: 'https?://(?:www|en.)?webshare.cz/(?:#/)?file/(?<id>[^/&?]+)',
};

export { OK, NOT_FOUND, NO_CONTENT, BAD_REQUEST, CORS, HEADERS, BODIES, R };
