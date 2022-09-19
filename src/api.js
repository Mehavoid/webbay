import { parsers } from './parser.js';

const ok = (x) => [x, x.startsWith('http') ? 200 : 404];
const error = () => ['503 Service Unavailable', 503];

const link = {
  options() {
    return [null, 204];
  },

  post(env, { link }) {
    if (!link) return ['The "link" parameter is missing', 404];
    const parser = parsers[link];
    if (!parser) return ['The "link" parameter is incorrect', 404];
    return parser(env).then(ok, error);
  },
};

export { link };
