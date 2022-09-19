import { CORS, CONTENT_TYPE, MIME_TYPES } from './http';

const unsafeFormData = async (request) => {
  try {
    const data = await request.formData();
    return Object.fromEntries(data);
  } catch {
    return null;
  }
};

const pipe = (f1, f2) => (x) => f1(x).then(f2);

const isNull = (o) => {
  if (o === null || o === undefined) return true;
  return false;
};

const getByPath = (data, dataPath, sep) => {
  const path = dataPath.split(sep);
  let result = data;
  for (let i = 0; i < path.length; i++) {
    const key = path[i].toLowerCase();
    const next = result[key];
    if (isNull(next)) return next;
    result = next;
  }
  return result;
};

const all = () => ['404 Not Found', { status: 404, headers: CORS }];
const post = async () => ['ok', { status: 200, headers: CORS }];
const options = () => [null, { status: 204, headers: CORS }];

const api = {
  webshare: { options, post },
  krakenfiles: { options, post },
};

const get = (target, prop) => {
  const handler = getByPath(target, prop, ',');
  if (handler) return handler;
  return all;
};

const dirs = new Proxy({ api }, { get });

const toRequest = async (request) => {
  const { pathname, searchParams } = new URL(request.url);
  const query = Object.fromEntries(searchParams);
  const chunks = pathname.substring(1).split('/');
  const handler = dirs[[chunks, request.method]];
  const form = await unsafeFormData(request);
  console.info({ query, dirs, form, handler });
  return handler({ query, dirs, form });
};

const toResponse = (result) => new Response(...result);

export default {
  fetch: pipe(toRequest, toResponse),
};
