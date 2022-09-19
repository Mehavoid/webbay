class ElementHandler {
  constructor() {
    this.attributes = null;
  }

  element({ attributes }) {
    this.attributes = Object.fromEntries(attributes);
  }
}

class Parser {
  constructor(response) {
    this.response = response;
    this.handler = new ElementHandler();
    this.rewriter = new HTMLRewriter();
  }

  parse(selector) {
    return this.rewriter
      .on(selector, this.handler)
      .transform(this.response)
      .arrayBuffer();
  }

  async querySelector(selector) {
    await this.parse(selector);
    return this.handler;
  }
}

const createBody = (data) => {
  const form = new FormData();
  const entries = Object.entries(data);
  for (const [k, v] of entries) form.set(k, v);
  return form;
};

const krakenfiles =
  ({ id }) =>
  async () => {
    const res = await fetch(`https://krakenfiles.com/view/${id}/file.html`);
    const parser = new Parser(res);
    const { attributes } = await parser.querySelector('#dl-token');
    const response = await fetch(`https://krakenfiles.com/download/${id}`, {
      method: 'POST',
      body: createBody({ token: attributes?.value }),
      headers: { hash: id },
    });
    const { url } = await response.json();
    return url;
  };

const webshare =
  ({ id }) =>
  async ({ wst }) => {
    const response = await fetch(
      'https://beta.webshare.cz/site/fast-download',
      {
        method: 'POST',
        body: createBody({ id, wst }),
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
      },
    );
    return response.text();
  };

const parsers = new Proxy(
  {
    'https?://(?:www.)?krakenfiles.com/view/(?<id>[^/&?]+)': krakenfiles,
    'https?://(?:www|en.)?webshare.cz/(?:#/)?file/(?<id>[^/&?]+)': webshare,
  },
  {
    get(target, prop) {
      for (const pattern of Object.keys(target)) {
        const match = prop.match(new RegExp(pattern));
        if (match) {
          return target[pattern](match.groups);
        }
      }
      return null;
    },
  },
);

export { parsers };
