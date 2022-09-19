import { CORS, CONTENT_TYPE, MIME_TYPES } from './http';

const unsafeFormData = async (request) => {
  try {
    const data = await request.formData();
    return Object.fromEntries(data);
  } catch {
    return null;
  }
};

const inRange = (s, min, max) => s >= min && s <= max;

const isExist = (o) => o !== null && typeof o !== 'undefined';

const isNotExist = (o) => !isExist(o);

const getByPath = (data, dataPath, sep) => {
  const path = dataPath.split(sep);
  let object = data;
  for (const name of path) {
    const next = object[name];
    if (isNotExist(next)) return next;
    object = next;
  }
  return object;
};

const all = () => ['404 Not Found', 404];
const post = async () => ['ok', 200];
const options = () => [null, 204];

const api = {
  webshare: { options, post },
  krakenfiles: { options, post },
};

const dirs = new Proxy(
  { api },
  {
    get(target, prop) {
      const path = prop.toLowerCase();
      const handler = getByPath(target, path, ',');
      if (handler) return handler;
      return all;
    },
  },
);

const prepareResponse = (data, status) => {
  const success = inRange(status, 200, 299);
  const exist = isExist(data);
  const body = exist ? JSON.stringify({ data, success }) : data;
  const mime = MIME_TYPES['json'];
  const headers = exist ? { ...CORS, [CONTENT_TYPE]: mime } : CORS;
  const options = { status, headers };
  return { body, options };
};

const handle = async (request) => {
  const { pathname, searchParams } = new URL(request.url);
  const query = Object.fromEntries(searchParams);
  const chunks = pathname.substring(1).split('/');
  const handler = dirs[[chunks, request.method]];
  const args = [];
  if (handler.length) args.push(await unsafeFormData(request));
  console.info({ query, chunks, args, handler });
  const [data, status] = await handler(...args);
  const { body, options } = prepareResponse(data, status);
  return new Response(body, options);
};

export default { fetch: handle };
