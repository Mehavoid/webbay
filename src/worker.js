import { Router } from 'itty-router';
import { validate } from '@cfworker/json-schema';

const headers = Object.freeze({
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': 86400,
  'Content-Type': 'application/json; charset=UTF-8',
});

const SOURCE_SCHEMA = {
  type: 'object',
  required: ['source'],
  properties: {
    source: {
      type: 'string',
      enum: ['webshare'],
    },
  },
};

const buildURLSchema = (pattern) => ({
  type: 'object',
  required: ['url'],
  properties: {
    url: {
      type: 'string',
      pattern,
    },
  },
});

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

const router = new Router();

router
  .options('/api/:source', () => new Response(null, { status: 204, headers }))
  .post('/api/:source', async (request) => {
    const { params } = request;
    const { valid: paramsValid } = validate(params, SOURCE_SCHEMA);
    if (paramsValid === false)
      return new Response(
        JSON.stringify(
          { status: 1, text: '404 Not Found' },
          { status: 404, headers },
        ),
      );
    const data = await safeFormData(request);
    if (isEmpty(data))
      return new Response(
        JSON.stringify(
          { status: 1, text: 'Request body is missing' },
          { status: 400, headers },
        ),
      );
    const schema = buildURLSchema(R[params.source]);
    const { valid: URLValid } = validate(data, schema);
    if (URLValid === false)
      return new Response(
        JSON.stringify(
          { status: 1, text: 'The "url" parameter is missing or incorrect' },
          { status: 400, headers },
        ),
      );
    return new Response(JSON.stringify({ status: 0, result: URLValid }), {
      status: 200,
      headers,
    });
  })
  .all(
    '*',
    () =>
      new Response(JSON.stringify({ status: 1, text: '404 Not Found' }), {
        status: 404,
        headers,
      }),
  );

export default {
  fetch: router.handle,
};
