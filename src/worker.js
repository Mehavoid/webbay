import { validate } from '@cfworker/json-schema';

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

const R = Object.freeze({
  krakenfiles: 'https?://(?:www.)?krakenfiles.com/view/(?<id>[^/&?]+)',
  webshare: 'https?://(?:www|en.)?webshare.cz/(?:#/)?file/(?<id>[^/&?]+)',
});

const safeFormData = async (request) => {
  try {
    const formData = await request.formData();
    return Object.fromEntries(formData);
  } catch {
    return null;
  }
};

const isEmpty = (object) => {
  for (const i in object) return false;
  return true;
};

const checkPaths = ({ paths }) => {
  const schema = {
    type: 'array',
    prefixItems: [{ enum: ['api'] }, { enum: ['krakenfiles', 'webshare'] }],
    required: ['api', 'webshare'],
  };
  const { valid } = validate(paths, schema);
  if (valid === false) return NOT_FOUND;
  return 0;
};

const checkBody = ({ paths, form, data }) => {
  if (isEmpty(form) && isEmpty(data)) return BAD_REQUEST;
  const source = paths[1];
  const schema = {
    type: 'object',
    properties: {
      url: { pattern: R[source] },
    },
    required: ['url'],
  };
  const { valid } = validate(form, schema);
  if (valid === false) return BAD_REQUEST;
  return 0;
};

const METHODS = new Proxy(
  {
    ALL: () => NOT_FOUND,
    POST: () => OK,
    OPTIONS: () => NO_CONTENT,
  },
  {
    get:
      (target, prop) =>
      (...args) => {
        const status = checkPaths(...args);
        if (status) return status;
        if (prop === 'POST') {
          const status = checkBody(...args);
          if (status) return status;
        }
        const fn = target[prop] || target['ALL'];
        return fn(...args);
      },
  },
);

const handle = async (request) => {
  const { pathname, searchParams } = new URL(request.url);
  const query = Object.fromEntries(searchParams);
  const paths = pathname.substring(1).split('/');
  const form = await safeFormData(request);
  const handler = METHODS[request.method];
  console.info({ query, paths, form, handler });
  const status = handler({ query, paths, form });
  const body = BODIES[status];
  const headers = status === NO_CONTENT ? CORS : HEADERS;
  return new Response(body, { status, headers });
};

export default {
  fetch: handle,
};
