import { validate } from '@cfworker/json-schema';

import { R, NOT_FOUND, BAD_REQUEST } from './constants';

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

export { checkPaths, checkBody };
