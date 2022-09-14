import { OK, NOT_FOUND, NO_CONTENT, BODIES, CORS, HEADERS } from './constants';
import { checkPaths, checkBody } from './schema';

const safeFormData = async (request) => {
  try {
    const formData = await request.formData();
    return Object.fromEntries(formData);
  } catch {
    return null;
  }
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
