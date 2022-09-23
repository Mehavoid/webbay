class ElementHandler {
  constructor() {
    this.counter = 0;
    this.attributes = null;
    this.textContent = new Map();
  }

  element({ attributes }) {
    this.attributes = Object.fromEntries(attributes);
  }

  text({ text, lastInTextNode }) {
    if (lastInTextNode) this.counter++;
    else this.textContent.set(this.counter, text);
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
    const response = await fetch('https://webshare.cz/api/file_link/', {
      method: 'POST',
      body: createBody({ ident: id, wst }),
    });
    const parser = new Parser(response);
    const { textContent } = await parser.querySelector('response');
    const link = textContent.get(1);
    if (link) return link;
    return '';
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
