var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __commonJS = (cb, mod) => function __require2() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// ../../node_modules/dotenv/package.json
var require_package = __commonJS({
  "../../node_modules/dotenv/package.json"(exports, module) {
    module.exports = {
      name: "dotenv",
      version: "16.6.1",
      description: "Loads environment variables from .env file",
      main: "lib/main.js",
      types: "lib/main.d.ts",
      exports: {
        ".": {
          types: "./lib/main.d.ts",
          require: "./lib/main.js",
          default: "./lib/main.js"
        },
        "./config": "./config.js",
        "./config.js": "./config.js",
        "./lib/env-options": "./lib/env-options.js",
        "./lib/env-options.js": "./lib/env-options.js",
        "./lib/cli-options": "./lib/cli-options.js",
        "./lib/cli-options.js": "./lib/cli-options.js",
        "./package.json": "./package.json"
      },
      scripts: {
        "dts-check": "tsc --project tests/types/tsconfig.json",
        lint: "standard",
        pretest: "npm run lint && npm run dts-check",
        test: "tap run --allow-empty-coverage --disable-coverage --timeout=60000",
        "test:coverage": "tap run --show-full-coverage --timeout=60000 --coverage-report=text --coverage-report=lcov",
        prerelease: "npm test",
        release: "standard-version"
      },
      repository: {
        type: "git",
        url: "git://github.com/motdotla/dotenv.git"
      },
      homepage: "https://github.com/motdotla/dotenv#readme",
      funding: "https://dotenvx.com",
      keywords: [
        "dotenv",
        "env",
        ".env",
        "environment",
        "variables",
        "config",
        "settings"
      ],
      readmeFilename: "README.md",
      license: "BSD-2-Clause",
      devDependencies: {
        "@types/node": "^18.11.3",
        decache: "^4.6.2",
        sinon: "^14.0.1",
        standard: "^17.0.0",
        "standard-version": "^9.5.0",
        tap: "^19.2.0",
        typescript: "^4.8.4"
      },
      engines: {
        node: ">=12"
      },
      browser: {
        fs: false
      }
    };
  }
});

// ../../node_modules/dotenv/lib/main.js
var require_main = __commonJS({
  "../../node_modules/dotenv/lib/main.js"(exports, module) {
    var fs = __require("fs");
    var path = __require("path");
    var os = __require("os");
    var crypto3 = __require("crypto");
    var packageJson = require_package();
    var version = packageJson.version;
    var LINE = /(?:^|^)\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)/mg;
    function parse2(src) {
      const obj = {};
      let lines = src.toString();
      lines = lines.replace(/\r\n?/mg, "\n");
      let match2;
      while ((match2 = LINE.exec(lines)) != null) {
        const key = match2[1];
        let value = match2[2] || "";
        value = value.trim();
        const maybeQuote = value[0];
        value = value.replace(/^(['"`])([\s\S]*)\1$/mg, "$2");
        if (maybeQuote === '"') {
          value = value.replace(/\\n/g, "\n");
          value = value.replace(/\\r/g, "\r");
        }
        obj[key] = value;
      }
      return obj;
    }
    function _parseVault(options) {
      options = options || {};
      const vaultPath = _vaultPath(options);
      options.path = vaultPath;
      const result = DotenvModule.configDotenv(options);
      if (!result.parsed) {
        const err = new Error(`MISSING_DATA: Cannot parse ${vaultPath} for an unknown reason`);
        err.code = "MISSING_DATA";
        throw err;
      }
      const keys = _dotenvKey(options).split(",");
      const length = keys.length;
      let decrypted;
      for (let i = 0; i < length; i++) {
        try {
          const key = keys[i].trim();
          const attrs = _instructions(result, key);
          decrypted = DotenvModule.decrypt(attrs.ciphertext, attrs.key);
          break;
        } catch (error) {
          if (i + 1 >= length) {
            throw error;
          }
        }
      }
      return DotenvModule.parse(decrypted);
    }
    function _warn(message) {
      console.log(`[dotenv@${version}][WARN] ${message}`);
    }
    function _debug(message) {
      console.log(`[dotenv@${version}][DEBUG] ${message}`);
    }
    function _log(message) {
      console.log(`[dotenv@${version}] ${message}`);
    }
    function _dotenvKey(options) {
      if (options && options.DOTENV_KEY && options.DOTENV_KEY.length > 0) {
        return options.DOTENV_KEY;
      }
      if (process.env.DOTENV_KEY && process.env.DOTENV_KEY.length > 0) {
        return process.env.DOTENV_KEY;
      }
      return "";
    }
    function _instructions(result, dotenvKey) {
      let uri;
      try {
        uri = new URL(dotenvKey);
      } catch (error) {
        if (error.code === "ERR_INVALID_URL") {
          const err = new Error("INVALID_DOTENV_KEY: Wrong format. Must be in valid uri format like dotenv://:key_1234@dotenvx.com/vault/.env.vault?environment=development");
          err.code = "INVALID_DOTENV_KEY";
          throw err;
        }
        throw error;
      }
      const key = uri.password;
      if (!key) {
        const err = new Error("INVALID_DOTENV_KEY: Missing key part");
        err.code = "INVALID_DOTENV_KEY";
        throw err;
      }
      const environment = uri.searchParams.get("environment");
      if (!environment) {
        const err = new Error("INVALID_DOTENV_KEY: Missing environment part");
        err.code = "INVALID_DOTENV_KEY";
        throw err;
      }
      const environmentKey = `DOTENV_VAULT_${environment.toUpperCase()}`;
      const ciphertext = result.parsed[environmentKey];
      if (!ciphertext) {
        const err = new Error(`NOT_FOUND_DOTENV_ENVIRONMENT: Cannot locate environment ${environmentKey} in your .env.vault file.`);
        err.code = "NOT_FOUND_DOTENV_ENVIRONMENT";
        throw err;
      }
      return { ciphertext, key };
    }
    function _vaultPath(options) {
      let possibleVaultPath = null;
      if (options && options.path && options.path.length > 0) {
        if (Array.isArray(options.path)) {
          for (const filepath of options.path) {
            if (fs.existsSync(filepath)) {
              possibleVaultPath = filepath.endsWith(".vault") ? filepath : `${filepath}.vault`;
            }
          }
        } else {
          possibleVaultPath = options.path.endsWith(".vault") ? options.path : `${options.path}.vault`;
        }
      } else {
        possibleVaultPath = path.resolve(process.cwd(), ".env.vault");
      }
      if (fs.existsSync(possibleVaultPath)) {
        return possibleVaultPath;
      }
      return null;
    }
    function _resolveHome(envPath) {
      return envPath[0] === "~" ? path.join(os.homedir(), envPath.slice(1)) : envPath;
    }
    function _configVault(options) {
      const debug = Boolean(options && options.debug);
      const quiet = options && "quiet" in options ? options.quiet : true;
      if (debug || !quiet) {
        _log("Loading env from encrypted .env.vault");
      }
      const parsed = DotenvModule._parseVault(options);
      let processEnv = process.env;
      if (options && options.processEnv != null) {
        processEnv = options.processEnv;
      }
      DotenvModule.populate(processEnv, parsed, options);
      return { parsed };
    }
    function configDotenv(options) {
      const dotenvPath = path.resolve(process.cwd(), ".env");
      let encoding = "utf8";
      const debug = Boolean(options && options.debug);
      const quiet = options && "quiet" in options ? options.quiet : true;
      if (options && options.encoding) {
        encoding = options.encoding;
      } else {
        if (debug) {
          _debug("No encoding is specified. UTF-8 is used by default");
        }
      }
      let optionPaths = [dotenvPath];
      if (options && options.path) {
        if (!Array.isArray(options.path)) {
          optionPaths = [_resolveHome(options.path)];
        } else {
          optionPaths = [];
          for (const filepath of options.path) {
            optionPaths.push(_resolveHome(filepath));
          }
        }
      }
      let lastError;
      const parsedAll = {};
      for (const path2 of optionPaths) {
        try {
          const parsed = DotenvModule.parse(fs.readFileSync(path2, { encoding }));
          DotenvModule.populate(parsedAll, parsed, options);
        } catch (e) {
          if (debug) {
            _debug(`Failed to load ${path2} ${e.message}`);
          }
          lastError = e;
        }
      }
      let processEnv = process.env;
      if (options && options.processEnv != null) {
        processEnv = options.processEnv;
      }
      DotenvModule.populate(processEnv, parsedAll, options);
      if (debug || !quiet) {
        const keysCount = Object.keys(parsedAll).length;
        const shortPaths = [];
        for (const filePath of optionPaths) {
          try {
            const relative = path.relative(process.cwd(), filePath);
            shortPaths.push(relative);
          } catch (e) {
            if (debug) {
              _debug(`Failed to load ${filePath} ${e.message}`);
            }
            lastError = e;
          }
        }
        _log(`injecting env (${keysCount}) from ${shortPaths.join(",")}`);
      }
      if (lastError) {
        return { parsed: parsedAll, error: lastError };
      } else {
        return { parsed: parsedAll };
      }
    }
    function config2(options) {
      if (_dotenvKey(options).length === 0) {
        return DotenvModule.configDotenv(options);
      }
      const vaultPath = _vaultPath(options);
      if (!vaultPath) {
        _warn(`You set DOTENV_KEY but you are missing a .env.vault file at ${vaultPath}. Did you forget to build it?`);
        return DotenvModule.configDotenv(options);
      }
      return DotenvModule._configVault(options);
    }
    function decrypt(encrypted, keyStr) {
      const key = Buffer.from(keyStr.slice(-64), "hex");
      let ciphertext = Buffer.from(encrypted, "base64");
      const nonce = ciphertext.subarray(0, 12);
      const authTag = ciphertext.subarray(-16);
      ciphertext = ciphertext.subarray(12, -16);
      try {
        const aesgcm = crypto3.createDecipheriv("aes-256-gcm", key, nonce);
        aesgcm.setAuthTag(authTag);
        return `${aesgcm.update(ciphertext)}${aesgcm.final()}`;
      } catch (error) {
        const isRange = error instanceof RangeError;
        const invalidKeyLength = error.message === "Invalid key length";
        const decryptionFailed = error.message === "Unsupported state or unable to authenticate data";
        if (isRange || invalidKeyLength) {
          const err = new Error("INVALID_DOTENV_KEY: It must be 64 characters long (or more)");
          err.code = "INVALID_DOTENV_KEY";
          throw err;
        } else if (decryptionFailed) {
          const err = new Error("DECRYPTION_FAILED: Please check your DOTENV_KEY");
          err.code = "DECRYPTION_FAILED";
          throw err;
        } else {
          throw error;
        }
      }
    }
    function populate(processEnv, parsed, options = {}) {
      const debug = Boolean(options && options.debug);
      const override = Boolean(options && options.override);
      if (typeof parsed !== "object") {
        const err = new Error("OBJECT_REQUIRED: Please check the processEnv argument being passed to populate");
        err.code = "OBJECT_REQUIRED";
        throw err;
      }
      for (const key of Object.keys(parsed)) {
        if (Object.prototype.hasOwnProperty.call(processEnv, key)) {
          if (override === true) {
            processEnv[key] = parsed[key];
          }
          if (debug) {
            if (override === true) {
              _debug(`"${key}" is already defined and WAS overwritten`);
            } else {
              _debug(`"${key}" is already defined and was NOT overwritten`);
            }
          }
        } else {
          processEnv[key] = parsed[key];
        }
      }
    }
    var DotenvModule = {
      configDotenv,
      _configVault,
      _parseVault,
      config: config2,
      decrypt,
      parse: parse2,
      populate
    };
    module.exports.configDotenv = DotenvModule.configDotenv;
    module.exports._configVault = DotenvModule._configVault;
    module.exports._parseVault = DotenvModule._parseVault;
    module.exports.config = DotenvModule.config;
    module.exports.decrypt = DotenvModule.decrypt;
    module.exports.parse = DotenvModule.parse;
    module.exports.populate = DotenvModule.populate;
    module.exports = DotenvModule;
  }
});

// ../../node_modules/@hono/node-server/dist/vercel.mjs
import { Http2ServerRequest as Http2ServerRequest2, constants as h2constants } from "http2";
import { Http2ServerRequest } from "http2";
import { Readable } from "stream";
import crypto2 from "crypto";
var RequestError = class extends Error {
  constructor(message, options) {
    super(message, options);
    this.name = "RequestError";
  }
};
var toRequestError = (e) => {
  if (e instanceof RequestError) {
    return e;
  }
  return new RequestError(e.message, { cause: e });
};
var GlobalRequest = global.Request;
var Request2 = class extends GlobalRequest {
  constructor(input, options) {
    if (typeof input === "object" && getRequestCache in input) {
      input = input[getRequestCache]();
    }
    if (typeof options?.body?.getReader !== "undefined") {
      ;
      options.duplex ??= "half";
    }
    super(input, options);
  }
};
var newHeadersFromIncoming = (incoming) => {
  const headerRecord = [];
  const rawHeaders = incoming.rawHeaders;
  for (let i = 0; i < rawHeaders.length; i += 2) {
    const { [i]: key, [i + 1]: value } = rawHeaders;
    if (key.charCodeAt(0) !== /*:*/
    58) {
      headerRecord.push([key, value]);
    }
  }
  return new Headers(headerRecord);
};
var wrapBodyStream = /* @__PURE__ */ Symbol("wrapBodyStream");
var newRequestFromIncoming = (method, url, headers, incoming, abortController) => {
  const init = {
    method,
    headers,
    signal: abortController.signal
  };
  if (method === "TRACE") {
    init.method = "GET";
    const req = new Request2(url, init);
    Object.defineProperty(req, "method", {
      get() {
        return "TRACE";
      }
    });
    return req;
  }
  if (!(method === "GET" || method === "HEAD")) {
    if ("rawBody" in incoming && incoming.rawBody instanceof Buffer) {
      init.body = new ReadableStream({
        start(controller) {
          controller.enqueue(incoming.rawBody);
          controller.close();
        }
      });
    } else if (incoming[wrapBodyStream]) {
      let reader;
      init.body = new ReadableStream({
        async pull(controller) {
          try {
            reader ||= Readable.toWeb(incoming).getReader();
            const { done, value } = await reader.read();
            if (done) {
              controller.close();
            } else {
              controller.enqueue(value);
            }
          } catch (error) {
            controller.error(error);
          }
        }
      });
    } else {
      init.body = Readable.toWeb(incoming);
    }
  }
  return new Request2(url, init);
};
var getRequestCache = /* @__PURE__ */ Symbol("getRequestCache");
var requestCache = /* @__PURE__ */ Symbol("requestCache");
var incomingKey = /* @__PURE__ */ Symbol("incomingKey");
var urlKey = /* @__PURE__ */ Symbol("urlKey");
var headersKey = /* @__PURE__ */ Symbol("headersKey");
var abortControllerKey = /* @__PURE__ */ Symbol("abortControllerKey");
var getAbortController = /* @__PURE__ */ Symbol("getAbortController");
var requestPrototype = {
  get method() {
    return this[incomingKey].method || "GET";
  },
  get url() {
    return this[urlKey];
  },
  get headers() {
    return this[headersKey] ||= newHeadersFromIncoming(this[incomingKey]);
  },
  [getAbortController]() {
    this[getRequestCache]();
    return this[abortControllerKey];
  },
  [getRequestCache]() {
    this[abortControllerKey] ||= new AbortController();
    return this[requestCache] ||= newRequestFromIncoming(
      this.method,
      this[urlKey],
      this.headers,
      this[incomingKey],
      this[abortControllerKey]
    );
  }
};
[
  "body",
  "bodyUsed",
  "cache",
  "credentials",
  "destination",
  "integrity",
  "mode",
  "redirect",
  "referrer",
  "referrerPolicy",
  "signal",
  "keepalive"
].forEach((k) => {
  Object.defineProperty(requestPrototype, k, {
    get() {
      return this[getRequestCache]()[k];
    }
  });
});
["arrayBuffer", "blob", "clone", "formData", "json", "text"].forEach((k) => {
  Object.defineProperty(requestPrototype, k, {
    value: function() {
      return this[getRequestCache]()[k]();
    }
  });
});
Object.defineProperty(requestPrototype, /* @__PURE__ */ Symbol.for("nodejs.util.inspect.custom"), {
  value: function(depth, options, inspectFn) {
    const props = {
      method: this.method,
      url: this.url,
      headers: this.headers,
      nativeRequest: this[requestCache]
    };
    return `Request (lightweight) ${inspectFn(props, { ...options, depth: depth == null ? null : depth - 1 })}`;
  }
});
Object.setPrototypeOf(requestPrototype, Request2.prototype);
var newRequest = (incoming, defaultHostname) => {
  const req = Object.create(requestPrototype);
  req[incomingKey] = incoming;
  const incomingUrl = incoming.url || "";
  if (incomingUrl[0] !== "/" && // short-circuit for performance. most requests are relative URL.
  (incomingUrl.startsWith("http://") || incomingUrl.startsWith("https://"))) {
    if (incoming instanceof Http2ServerRequest) {
      throw new RequestError("Absolute URL for :path is not allowed in HTTP/2");
    }
    try {
      const url2 = new URL(incomingUrl);
      req[urlKey] = url2.href;
    } catch (e) {
      throw new RequestError("Invalid absolute URL", { cause: e });
    }
    return req;
  }
  const host = (incoming instanceof Http2ServerRequest ? incoming.authority : incoming.headers.host) || defaultHostname;
  if (!host) {
    throw new RequestError("Missing host header");
  }
  let scheme;
  if (incoming instanceof Http2ServerRequest) {
    scheme = incoming.scheme;
    if (!(scheme === "http" || scheme === "https")) {
      throw new RequestError("Unsupported scheme");
    }
  } else {
    scheme = incoming.socket && incoming.socket.encrypted ? "https" : "http";
  }
  const url = new URL(`${scheme}://${host}${incomingUrl}`);
  if (url.hostname.length !== host.length && url.hostname !== host.replace(/:\d+$/, "")) {
    throw new RequestError("Invalid host header");
  }
  req[urlKey] = url.href;
  return req;
};
var responseCache = /* @__PURE__ */ Symbol("responseCache");
var getResponseCache = /* @__PURE__ */ Symbol("getResponseCache");
var cacheKey = /* @__PURE__ */ Symbol("cache");
var GlobalResponse = global.Response;
var Response2 = class _Response {
  #body;
  #init;
  [getResponseCache]() {
    delete this[cacheKey];
    return this[responseCache] ||= new GlobalResponse(this.#body, this.#init);
  }
  constructor(body, init) {
    let headers;
    this.#body = body;
    if (init instanceof _Response) {
      const cachedGlobalResponse = init[responseCache];
      if (cachedGlobalResponse) {
        this.#init = cachedGlobalResponse;
        this[getResponseCache]();
        return;
      } else {
        this.#init = init.#init;
        headers = new Headers(init.#init.headers);
      }
    } else {
      this.#init = init;
    }
    if (typeof body === "string" || typeof body?.getReader !== "undefined" || body instanceof Blob || body instanceof Uint8Array) {
      ;
      this[cacheKey] = [init?.status || 200, body, headers || init?.headers];
    }
  }
  get headers() {
    const cache = this[cacheKey];
    if (cache) {
      if (!(cache[2] instanceof Headers)) {
        cache[2] = new Headers(
          cache[2] || { "content-type": "text/plain; charset=UTF-8" }
        );
      }
      return cache[2];
    }
    return this[getResponseCache]().headers;
  }
  get status() {
    return this[cacheKey]?.[0] ?? this[getResponseCache]().status;
  }
  get ok() {
    const status = this.status;
    return status >= 200 && status < 300;
  }
};
["body", "bodyUsed", "redirected", "statusText", "trailers", "type", "url"].forEach((k) => {
  Object.defineProperty(Response2.prototype, k, {
    get() {
      return this[getResponseCache]()[k];
    }
  });
});
["arrayBuffer", "blob", "clone", "formData", "json", "text"].forEach((k) => {
  Object.defineProperty(Response2.prototype, k, {
    value: function() {
      return this[getResponseCache]()[k]();
    }
  });
});
Object.defineProperty(Response2.prototype, /* @__PURE__ */ Symbol.for("nodejs.util.inspect.custom"), {
  value: function(depth, options, inspectFn) {
    const props = {
      status: this.status,
      headers: this.headers,
      ok: this.ok,
      nativeResponse: this[responseCache]
    };
    return `Response (lightweight) ${inspectFn(props, { ...options, depth: depth == null ? null : depth - 1 })}`;
  }
});
Object.setPrototypeOf(Response2, GlobalResponse);
Object.setPrototypeOf(Response2.prototype, GlobalResponse.prototype);
async function readWithoutBlocking(readPromise) {
  return Promise.race([readPromise, Promise.resolve().then(() => Promise.resolve(void 0))]);
}
function writeFromReadableStreamDefaultReader(reader, writable, currentReadPromise) {
  const cancel = (error) => {
    reader.cancel(error).catch(() => {
    });
  };
  writable.on("close", cancel);
  writable.on("error", cancel);
  (currentReadPromise ?? reader.read()).then(flow, handleStreamError);
  return reader.closed.finally(() => {
    writable.off("close", cancel);
    writable.off("error", cancel);
  });
  function handleStreamError(error) {
    if (error) {
      writable.destroy(error);
    }
  }
  function onDrain() {
    reader.read().then(flow, handleStreamError);
  }
  function flow({ done, value }) {
    try {
      if (done) {
        writable.end();
      } else if (!writable.write(value)) {
        writable.once("drain", onDrain);
      } else {
        return reader.read().then(flow, handleStreamError);
      }
    } catch (e) {
      handleStreamError(e);
    }
  }
}
function writeFromReadableStream(stream, writable) {
  if (stream.locked) {
    throw new TypeError("ReadableStream is locked.");
  } else if (writable.destroyed) {
    return;
  }
  return writeFromReadableStreamDefaultReader(stream.getReader(), writable);
}
var buildOutgoingHttpHeaders = (headers) => {
  const res = {};
  if (!(headers instanceof Headers)) {
    headers = new Headers(headers ?? void 0);
  }
  const cookies = [];
  for (const [k, v] of headers) {
    if (k === "set-cookie") {
      cookies.push(v);
    } else {
      res[k] = v;
    }
  }
  if (cookies.length > 0) {
    res["set-cookie"] = cookies;
  }
  res["content-type"] ??= "text/plain; charset=UTF-8";
  return res;
};
var X_ALREADY_SENT = "x-hono-already-sent";
if (typeof global.crypto === "undefined") {
  global.crypto = crypto2;
}
var outgoingEnded = /* @__PURE__ */ Symbol("outgoingEnded");
var incomingDraining = /* @__PURE__ */ Symbol("incomingDraining");
var DRAIN_TIMEOUT_MS = 500;
var MAX_DRAIN_BYTES = 64 * 1024 * 1024;
var drainIncoming = (incoming) => {
  const incomingWithDrainState = incoming;
  if (incoming.destroyed || incomingWithDrainState[incomingDraining]) {
    return;
  }
  incomingWithDrainState[incomingDraining] = true;
  if (incoming instanceof Http2ServerRequest2) {
    try {
      ;
      incoming.stream?.close?.(h2constants.NGHTTP2_NO_ERROR);
    } catch {
    }
    return;
  }
  let bytesRead = 0;
  const cleanup = () => {
    clearTimeout(timer);
    incoming.off("data", onData);
    incoming.off("end", cleanup);
    incoming.off("error", cleanup);
  };
  const forceClose = () => {
    cleanup();
    const socket = incoming.socket;
    if (socket && !socket.destroyed) {
      socket.destroySoon();
    }
  };
  const timer = setTimeout(forceClose, DRAIN_TIMEOUT_MS);
  timer.unref?.();
  const onData = (chunk) => {
    bytesRead += chunk.length;
    if (bytesRead > MAX_DRAIN_BYTES) {
      forceClose();
    }
  };
  incoming.on("data", onData);
  incoming.on("end", cleanup);
  incoming.on("error", cleanup);
  incoming.resume();
};
var handleRequestError = () => new Response(null, {
  status: 400
});
var handleFetchError = (e) => new Response(null, {
  status: e instanceof Error && (e.name === "TimeoutError" || e.constructor.name === "TimeoutError") ? 504 : 500
});
var handleResponseError = (e, outgoing) => {
  const err = e instanceof Error ? e : new Error("unknown error", { cause: e });
  if (err.code === "ERR_STREAM_PREMATURE_CLOSE") {
    console.info("The user aborted a request.");
  } else {
    console.error(e);
    if (!outgoing.headersSent) {
      outgoing.writeHead(500, { "Content-Type": "text/plain" });
    }
    outgoing.end(`Error: ${err.message}`);
    outgoing.destroy(err);
  }
};
var flushHeaders = (outgoing) => {
  if ("flushHeaders" in outgoing && outgoing.writable) {
    outgoing.flushHeaders();
  }
};
var responseViaCache = async (res, outgoing) => {
  let [status, body, header] = res[cacheKey];
  let hasContentLength = false;
  if (!header) {
    header = { "content-type": "text/plain; charset=UTF-8" };
  } else if (header instanceof Headers) {
    hasContentLength = header.has("content-length");
    header = buildOutgoingHttpHeaders(header);
  } else if (Array.isArray(header)) {
    const headerObj = new Headers(header);
    hasContentLength = headerObj.has("content-length");
    header = buildOutgoingHttpHeaders(headerObj);
  } else {
    for (const key in header) {
      if (key.length === 14 && key.toLowerCase() === "content-length") {
        hasContentLength = true;
        break;
      }
    }
  }
  if (!hasContentLength) {
    if (typeof body === "string") {
      header["Content-Length"] = Buffer.byteLength(body);
    } else if (body instanceof Uint8Array) {
      header["Content-Length"] = body.byteLength;
    } else if (body instanceof Blob) {
      header["Content-Length"] = body.size;
    }
  }
  outgoing.writeHead(status, header);
  if (typeof body === "string" || body instanceof Uint8Array) {
    outgoing.end(body);
  } else if (body instanceof Blob) {
    outgoing.end(new Uint8Array(await body.arrayBuffer()));
  } else {
    flushHeaders(outgoing);
    await writeFromReadableStream(body, outgoing)?.catch(
      (e) => handleResponseError(e, outgoing)
    );
  }
  ;
  outgoing[outgoingEnded]?.();
};
var isPromise = (res) => typeof res.then === "function";
var responseViaResponseObject = async (res, outgoing, options = {}) => {
  if (isPromise(res)) {
    if (options.errorHandler) {
      try {
        res = await res;
      } catch (err) {
        const errRes = await options.errorHandler(err);
        if (!errRes) {
          return;
        }
        res = errRes;
      }
    } else {
      res = await res.catch(handleFetchError);
    }
  }
  if (cacheKey in res) {
    return responseViaCache(res, outgoing);
  }
  const resHeaderRecord = buildOutgoingHttpHeaders(res.headers);
  if (res.body) {
    const reader = res.body.getReader();
    const values = [];
    let done = false;
    let currentReadPromise = void 0;
    if (resHeaderRecord["transfer-encoding"] !== "chunked") {
      let maxReadCount = 2;
      for (let i = 0; i < maxReadCount; i++) {
        currentReadPromise ||= reader.read();
        const chunk = await readWithoutBlocking(currentReadPromise).catch((e) => {
          console.error(e);
          done = true;
        });
        if (!chunk) {
          if (i === 1) {
            await new Promise((resolve2) => setTimeout(resolve2));
            maxReadCount = 3;
            continue;
          }
          break;
        }
        currentReadPromise = void 0;
        if (chunk.value) {
          values.push(chunk.value);
        }
        if (chunk.done) {
          done = true;
          break;
        }
      }
      if (done && !("content-length" in resHeaderRecord)) {
        resHeaderRecord["content-length"] = values.reduce((acc, value) => acc + value.length, 0);
      }
    }
    outgoing.writeHead(res.status, resHeaderRecord);
    values.forEach((value) => {
      ;
      outgoing.write(value);
    });
    if (done) {
      outgoing.end();
    } else {
      if (values.length === 0) {
        flushHeaders(outgoing);
      }
      await writeFromReadableStreamDefaultReader(reader, outgoing, currentReadPromise);
    }
  } else if (resHeaderRecord[X_ALREADY_SENT]) {
  } else {
    outgoing.writeHead(res.status, resHeaderRecord);
    outgoing.end();
  }
  ;
  outgoing[outgoingEnded]?.();
};
var getRequestListener = (fetchCallback, options = {}) => {
  const autoCleanupIncoming = options.autoCleanupIncoming ?? true;
  if (options.overrideGlobalObjects !== false && global.Request !== Request2) {
    Object.defineProperty(global, "Request", {
      value: Request2
    });
    Object.defineProperty(global, "Response", {
      value: Response2
    });
  }
  return async (incoming, outgoing) => {
    let res, req;
    try {
      req = newRequest(incoming, options.hostname);
      let incomingEnded = !autoCleanupIncoming || incoming.method === "GET" || incoming.method === "HEAD";
      if (!incomingEnded) {
        ;
        incoming[wrapBodyStream] = true;
        incoming.on("end", () => {
          incomingEnded = true;
        });
        if (incoming instanceof Http2ServerRequest2) {
          ;
          outgoing[outgoingEnded] = () => {
            if (!incomingEnded) {
              setTimeout(() => {
                if (!incomingEnded) {
                  setTimeout(() => {
                    drainIncoming(incoming);
                  });
                }
              });
            }
          };
        }
        outgoing.on("finish", () => {
          if (!incomingEnded) {
            drainIncoming(incoming);
          }
        });
      }
      outgoing.on("close", () => {
        const abortController = req[abortControllerKey];
        if (abortController) {
          if (incoming.errored) {
            req[abortControllerKey].abort(incoming.errored.toString());
          } else if (!outgoing.writableFinished) {
            req[abortControllerKey].abort("Client connection prematurely closed.");
          }
        }
        if (!incomingEnded) {
          setTimeout(() => {
            if (!incomingEnded) {
              setTimeout(() => {
                drainIncoming(incoming);
              });
            }
          });
        }
      });
      res = fetchCallback(req, { incoming, outgoing });
      if (cacheKey in res) {
        return responseViaCache(res, outgoing);
      }
    } catch (e) {
      if (!res) {
        if (options.errorHandler) {
          res = await options.errorHandler(req ? e : toRequestError(e));
          if (!res) {
            return;
          }
        } else if (!req) {
          res = handleRequestError();
        } else {
          res = handleFetchError(e);
        }
      } else {
        return handleResponseError(e, outgoing);
      }
    }
    try {
      return await responseViaResponseObject(res, outgoing, options);
    } catch (e) {
      return handleResponseError(e, outgoing);
    }
  };
};
var handle = (app2) => {
  return getRequestListener(app2.fetch);
};

// src/setup-env.ts
var import_dotenv = __toESM(require_main(), 1);
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
var root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
(0, import_dotenv.config)({ path: resolve(root, ".env") });
(0, import_dotenv.config)({ path: resolve(root, "packages/db/.env") });

// ../../node_modules/hono/dist/compose.js
var compose = (middleware, onError, onNotFound) => {
  return (context, next) => {
    let index = -1;
    return dispatch(0);
    async function dispatch(i) {
      if (i <= index) {
        throw new Error("next() called multiple times");
      }
      index = i;
      let res;
      let isError = false;
      let handler;
      if (middleware[i]) {
        handler = middleware[i][0][0];
        context.req.routeIndex = i;
      } else {
        handler = i === middleware.length && next || void 0;
      }
      if (handler) {
        try {
          res = await handler(context, () => dispatch(i + 1));
        } catch (err) {
          if (err instanceof Error && onError) {
            context.error = err;
            res = await onError(err, context);
            isError = true;
          } else {
            throw err;
          }
        }
      } else {
        if (context.finalized === false && onNotFound) {
          res = await onNotFound(context);
        }
      }
      if (res && (context.finalized === false || isError)) {
        context.res = res;
      }
      return context;
    }
  };
};

// ../../node_modules/hono/dist/request/constants.js
var GET_MATCH_RESULT = /* @__PURE__ */ Symbol();

// ../../node_modules/hono/dist/utils/buffer.js
var bufferToFormData = (arrayBuffer, contentType) => {
  const response = new Response(arrayBuffer, {
    headers: {
      // Normalize the media type (case-insensitive) while keeping parameters like the boundary
      "Content-Type": contentType.replace(/^[^;]+/, (mediaType) => mediaType.toLowerCase())
    }
  });
  return response.formData();
};

// ../../node_modules/hono/dist/utils/body.js
var MAX_NESTING_DEPTH = 32;
var MAX_NESTED_OBJECTS = 1e4;
var isRawRequest = (request) => "headers" in request;
var parseBody = async (request, options = /* @__PURE__ */ Object.create(null)) => {
  const { all = false, dot = false } = options;
  const headers = isRawRequest(request) ? request.headers : request.raw.headers;
  const contentType = headers.get("Content-Type");
  const mediaType = contentType?.split(";")[0].trim().toLowerCase();
  if (mediaType === "multipart/form-data" || mediaType === "application/x-www-form-urlencoded") {
    return parseFormData(request, { all, dot });
  }
  return {};
};
async function parseFormData(request, options) {
  if (!isRawRequest(request) && request.bodyCache.formData) {
    return convertFormDataToBodyData(
      await request.bodyCache.formData,
      options
    );
  }
  const headers = isRawRequest(request) ? request.headers : request.raw.headers;
  const arrayBuffer = await request.arrayBuffer();
  const formDataPromise = bufferToFormData(arrayBuffer, headers.get("Content-Type") || "");
  if (!isRawRequest(request)) {
    request.bodyCache.formData = formDataPromise;
  }
  const formData = await formDataPromise;
  if (formData) {
    return convertFormDataToBodyData(formData, options);
  }
  return {};
}
function convertFormDataToBodyData(formData, options) {
  const form = /* @__PURE__ */ Object.create(null);
  const nestingState = { count: 0 };
  formData.forEach((value, key) => {
    const shouldParseAllValues = options.all || key.endsWith("[]");
    if (!shouldParseAllValues) {
      form[key] = value;
    } else {
      handleParsingAllValues(form, key, value);
    }
  });
  if (options.dot) {
    Object.entries(form).forEach(([key, value]) => {
      const shouldParseDotValues = key.includes(".");
      if (shouldParseDotValues) {
        handleParsingNestedValues(form, key, value, nestingState);
        delete form[key];
      }
    });
  }
  return form;
}
var handleParsingAllValues = (form, key, value) => {
  if (form[key] !== void 0) {
    if (Array.isArray(form[key])) {
      ;
      form[key].push(value);
    } else {
      form[key] = [form[key], value];
    }
  } else {
    if (!key.endsWith("[]")) {
      form[key] = value;
    } else {
      form[key] = [value];
    }
  }
};
var handleParsingNestedValues = (form, key, value, state) => {
  if (/(?:^|\.)__proto__\./.test(key)) {
    return;
  }
  let nestedForm = form;
  const keys = key.split(".", MAX_NESTING_DEPTH + 2);
  if (keys.length > MAX_NESTING_DEPTH + 1) {
    throwNestingLimitExceeded();
  }
  keys.forEach((key2, index) => {
    if (index === keys.length - 1) {
      nestedForm[key2] = value;
    } else {
      if (!nestedForm[key2] || typeof nestedForm[key2] !== "object" || Array.isArray(nestedForm[key2]) || nestedForm[key2] instanceof File) {
        if (state.count++ >= MAX_NESTED_OBJECTS) {
          throwNestingLimitExceeded();
        }
        nestedForm[key2] = /* @__PURE__ */ Object.create(null);
      }
      nestedForm = nestedForm[key2];
    }
  });
};
var throwNestingLimitExceeded = () => {
  throw new Error("Nesting limit exceeded");
};

// ../../node_modules/hono/dist/utils/url.js
var splitPath = (path) => {
  const paths = path.split("/");
  if (paths[0] === "") {
    paths.shift();
  }
  return paths;
};
var splitRoutingPath = (routePath) => {
  const { groups, path } = extractGroupsFromPath(routePath);
  const paths = splitPath(path);
  return replaceGroupMarks(paths, groups);
};
var extractGroupsFromPath = (path) => {
  const groups = [];
  path = path.replace(/\{[^}]+\}/g, (match2, index) => {
    const mark = `@${index}`;
    groups.push([mark, match2]);
    return mark;
  });
  return { groups, path };
};
var replaceGroupMarks = (paths, groups) => {
  for (let i = groups.length - 1; i >= 0; i--) {
    const [mark] = groups[i];
    for (let j = paths.length - 1; j >= 0; j--) {
      if (paths[j].includes(mark)) {
        paths[j] = paths[j].replace(mark, groups[i][1]);
        break;
      }
    }
  }
  return paths;
};
var patternCache = {};
var getPattern = (label, next) => {
  if (label === "*") {
    return "*";
  }
  const match2 = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (match2) {
    const cacheKey2 = `${label}#${next}`;
    if (!patternCache[cacheKey2]) {
      if (match2[2]) {
        patternCache[cacheKey2] = next && next[0] !== ":" && next[0] !== "*" ? [cacheKey2, match2[1], new RegExp(`^${match2[2]}(?=/${next})`)] : [label, match2[1], new RegExp(`^${match2[2]}$`)];
      } else {
        patternCache[cacheKey2] = [label, match2[1], true];
      }
    }
    return patternCache[cacheKey2];
  }
  return null;
};
var tryDecode = (str, decoder) => {
  try {
    return decoder(str);
  } catch {
    return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, (match2) => {
      try {
        return decoder(match2);
      } catch {
        return match2;
      }
    });
  }
};
var tryDecodeURI = (str) => tryDecode(str, decodeURI);
var getPath = (request) => {
  const url = request.url;
  const start = url.indexOf("/", url.indexOf(":") + 4);
  let i = start;
  for (; i < url.length; i++) {
    const charCode = url.charCodeAt(i);
    if (charCode === 37) {
      const queryIndex = url.indexOf("?", i);
      const hashIndex = url.indexOf("#", i);
      const end = queryIndex === -1 ? hashIndex === -1 ? void 0 : hashIndex : hashIndex === -1 ? queryIndex : Math.min(queryIndex, hashIndex);
      const path = url.slice(start, end);
      return tryDecodeURI(path.includes("%25") ? path.replace(/%25/g, "%2525") : path);
    } else if (charCode === 63 || charCode === 35) {
      break;
    }
  }
  return url.slice(start, i);
};
var getPathNoStrict = (request) => {
  const result = getPath(request);
  return result.length > 1 && result.at(-1) === "/" ? result.slice(0, -1) : result;
};
var mergePath = (base, sub, ...rest) => {
  if (rest.length) {
    sub = mergePath(sub, ...rest);
  }
  return `${base?.[0] === "/" ? "" : "/"}${base}${sub === "/" ? "" : `${base?.at(-1) === "/" ? "" : "/"}${sub?.[0] === "/" ? sub.slice(1) : sub}`}`;
};
var checkOptionalParameter = (path) => {
  if (path.charCodeAt(path.length - 1) !== 63 || !path.includes(":")) {
    return null;
  }
  const segments = path.split("/");
  const results = [];
  let basePath = "";
  segments.forEach((segment) => {
    if (segment !== "" && !/\:/.test(segment)) {
      basePath += "/" + segment;
    } else if (/\:/.test(segment)) {
      if (segment.charCodeAt(segment.length - 1) === 63) {
        if (results.length === 0 && basePath === "") {
          results.push("/");
        } else {
          results.push(basePath);
        }
        const optionalSegment = segment.slice(0, -1);
        basePath += "/" + optionalSegment;
        results.push(basePath);
      } else {
        basePath += "/" + segment;
      }
    }
  });
  return results.filter((v, i, a) => a.indexOf(v) === i);
};
var tryDecodeURIComponent = (str) => str.indexOf("%") !== -1 ? tryDecode(str, decodeURIComponent_) : str;
var _decodeURI = (value) => {
  if (value.indexOf("+") !== -1) {
    value = value.replace(/\+/g, " ");
  }
  return tryDecodeURIComponent(value);
};
var _getQueryParam = (url, key, multiple) => {
  const hashIndex = url.indexOf("#", 8);
  if (hashIndex !== -1) {
    url = url.slice(0, hashIndex);
  }
  let encoded;
  if (!multiple && key && key.indexOf("%") === -1 && key.indexOf("+") === -1) {
    let keyIndex2 = url.indexOf("?", 8);
    if (keyIndex2 === -1) {
      return void 0;
    }
    if (!url.startsWith(key, keyIndex2 + 1)) {
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    while (keyIndex2 !== -1) {
      const trailingKeyCode = url.charCodeAt(keyIndex2 + key.length + 1);
      if (trailingKeyCode === 61) {
        const valueIndex = keyIndex2 + key.length + 2;
        const endIndex = url.indexOf("&", valueIndex);
        return _decodeURI(url.slice(valueIndex, endIndex === -1 ? void 0 : endIndex));
      } else if (trailingKeyCode == 38 || isNaN(trailingKeyCode)) {
        return "";
      }
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    encoded = /[%+]/.test(url);
    if (!encoded) {
      return void 0;
    }
  }
  const results = /* @__PURE__ */ Object.create(null);
  encoded ??= /[%+]/.test(url);
  let keyIndex = url.indexOf("?", 8);
  while (keyIndex !== -1) {
    const nextKeyIndex = url.indexOf("&", keyIndex + 1);
    let valueIndex = url.indexOf("=", keyIndex);
    if (valueIndex > nextKeyIndex && nextKeyIndex !== -1) {
      valueIndex = -1;
    }
    let name = url.slice(
      keyIndex + 1,
      valueIndex === -1 ? nextKeyIndex === -1 ? void 0 : nextKeyIndex : valueIndex
    );
    if (encoded) {
      name = _decodeURI(name);
    }
    keyIndex = nextKeyIndex;
    if (name === "") {
      continue;
    }
    let value;
    if (valueIndex === -1) {
      value = "";
    } else {
      value = url.slice(valueIndex + 1, nextKeyIndex === -1 ? void 0 : nextKeyIndex);
      if (encoded) {
        value = _decodeURI(value);
      }
    }
    if (multiple) {
      if (!(results[name] && Array.isArray(results[name]))) {
        results[name] = [];
      }
      ;
      results[name].push(value);
    } else {
      results[name] ??= value;
    }
  }
  return key ? results[key] : results;
};
var getQueryParam = _getQueryParam;
var getQueryParams = (url, key) => {
  return _getQueryParam(url, key, true);
};
var decodeURIComponent_ = decodeURIComponent;

// ../../node_modules/hono/dist/request.js
var HonoRequest = class {
  /**
   * `.raw` can get the raw Request object.
   *
   * @see {@link https://hono.dev/docs/api/request#raw}
   *
   * @example
   * ```ts
   * // For Cloudflare Workers
   * app.post('/', async (c) => {
   *   const metadata = c.req.raw.cf?.hostMetadata?
   *   ...
   * })
   * ```
   */
  raw;
  #validatedData;
  // Short name of validatedData
  #matchResult;
  routeIndex = 0;
  /**
   * `.path` can get the pathname of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#path}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const pathname = c.req.path // `/about/me`
   * })
   * ```
   */
  path;
  bodyCache = {};
  constructor(request, path = "/", matchResult = [[]]) {
    this.raw = request;
    this.path = path;
    this.#matchResult = matchResult;
  }
  param(key) {
    return key ? this.#getDecodedParam(key) : this.#getAllDecodedParams();
  }
  #getDecodedParam(key) {
    const paramKey = this.#matchResult[0][this.routeIndex]?.[1][key];
    const param = this.#getParamValue(paramKey);
    return param && tryDecodeURIComponent(param);
  }
  #getAllDecodedParams() {
    const decoded = {};
    const keys = Object.keys(this.#matchResult[0][this.routeIndex]?.[1] ?? {});
    for (const key of keys) {
      const value = this.#getParamValue(this.#matchResult[0][this.routeIndex][1][key]);
      if (value !== void 0) {
        decoded[key] = tryDecodeURIComponent(value);
      }
    }
    return decoded;
  }
  #getParamValue(paramKey) {
    return this.#matchResult[1] ? this.#matchResult[1][paramKey] : paramKey;
  }
  query(key) {
    return getQueryParam(this.url, key);
  }
  queries(key) {
    return getQueryParams(this.url, key);
  }
  header(name) {
    if (name) {
      return this.raw.headers.get(name) ?? void 0;
    }
    const headerData = /* @__PURE__ */ Object.create(null);
    this.raw.headers.forEach((value, key) => {
      headerData[key] = value;
    });
    return headerData;
  }
  async parseBody(options) {
    return parseBody(this, options);
  }
  #cachedBody = (key) => {
    const { bodyCache, raw: raw2 } = this;
    const cachedBody = bodyCache[key];
    if (cachedBody) {
      return cachedBody;
    }
    for (const anyCachedKey in bodyCache) {
      return bodyCache[anyCachedKey].then((body) => {
        if (anyCachedKey === "json") {
          body = JSON.stringify(body);
        }
        return new Response(body)[key]();
      });
    }
    return bodyCache[key] = raw2[key]();
  };
  /**
   * `.json()` can parse Request body of type `application/json`
   *
   * @see {@link https://hono.dev/docs/api/request#json}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.json()
   * })
   * ```
   */
  json() {
    return this.#cachedBody("text").then((text) => JSON.parse(text));
  }
  /**
   * `.text()` can parse Request body of type `text/plain`
   *
   * @see {@link https://hono.dev/docs/api/request#text}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.text()
   * })
   * ```
   */
  text() {
    return this.#cachedBody("text");
  }
  /**
   * `.arrayBuffer()` parse Request body as an `ArrayBuffer`
   *
   * @see {@link https://hono.dev/docs/api/request#arraybuffer}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.arrayBuffer()
   * })
   * ```
   */
  arrayBuffer() {
    return this.#cachedBody("arrayBuffer");
  }
  /**
   * `.bytes()` parses the request body as a `Uint8Array`.
   *
   * @see {@link https://hono.dev/docs/api/request#bytes}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.bytes()
   * })
   * ```
   */
  bytes() {
    return this.#cachedBody("arrayBuffer").then((buffer) => new Uint8Array(buffer));
  }
  /**
   * Parses the request body as a `Blob`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.blob();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#blob
   */
  blob() {
    return this.#cachedBody("blob");
  }
  /**
   * Parses the request body as `FormData`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.formData();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#formdata
   */
  formData() {
    return this.#cachedBody("formData");
  }
  /**
   * Adds validated data to the request.
   *
   * @param target - The target of the validation.
   * @param data - The validated data to add.
   */
  addValidatedData(target, data) {
    ;
    (this.#validatedData ??= {})[target] = data;
  }
  valid(target) {
    return this.#validatedData?.[target];
  }
  /**
   * `.url()` can get the request url strings.
   *
   * @see {@link https://hono.dev/docs/api/request#url}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const url = c.req.url // `http://localhost:8787/about/me`
   *   ...
   * })
   * ```
   */
  get url() {
    return this.raw.url;
  }
  /**
   * `.method()` can get the method name of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#method}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const method = c.req.method // `GET`
   * })
   * ```
   */
  get method() {
    return this.raw.method;
  }
  get [GET_MATCH_RESULT]() {
    return this.#matchResult;
  }
  /**
   * `.matchedRoutes()` can return a matched route in the handler
   *
   * @deprecated
   *
   * Use matchedRoutes helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#matchedroutes}
   *
   * @example
   * ```ts
   * app.use('*', async function logger(c, next) {
   *   await next()
   *   c.req.matchedRoutes.forEach(({ handler, method, path }, i) => {
   *     const name = handler.name || (handler.length < 2 ? '[handler]' : '[middleware]')
   *     console.log(
   *       method,
   *       ' ',
   *       path,
   *       ' '.repeat(Math.max(10 - path.length, 0)),
   *       name,
   *       i === c.req.routeIndex ? '<- respond from here' : ''
   *     )
   *   })
   * })
   * ```
   */
  get matchedRoutes() {
    return this.#matchResult[0].map(([[, route]]) => route);
  }
  /**
   * `routePath()` can retrieve the path registered within the handler
   *
   * @deprecated
   *
   * Use routePath helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#routepath}
   *
   * @example
   * ```ts
   * app.get('/posts/:id', (c) => {
   *   return c.json({ path: c.req.routePath })
   * })
   * ```
   */
  get routePath() {
    return this.#matchResult[0].map(([[, route]]) => route)[this.routeIndex].path;
  }
};

// ../../node_modules/hono/dist/utils/html.js
var HtmlEscapedCallbackPhase = {
  Stringify: 1,
  BeforeStream: 2,
  Stream: 3
};
var raw = (value, callbacks) => {
  const escapedString = new String(value);
  escapedString.isEscaped = true;
  escapedString.callbacks = callbacks;
  return escapedString;
};
var resolveCallback = async (str, phase, preserveCallbacks, context, buffer) => {
  if (typeof str === "object" && !(str instanceof String)) {
    if (!(str instanceof Promise)) {
      str = str.toString();
    }
    if (str instanceof Promise) {
      str = await str;
    }
  }
  const callbacks = str.callbacks;
  if (!callbacks?.length) {
    return Promise.resolve(str);
  }
  if (buffer) {
    buffer[0] += str;
  } else {
    buffer = [str];
  }
  const resStr = Promise.all(callbacks.map((c) => c({ phase, buffer, context }))).then(
    (res) => Promise.all(
      res.filter(Boolean).map((str2) => resolveCallback(str2, phase, false, context, buffer))
    ).then(() => buffer[0])
  );
  if (preserveCallbacks) {
    return raw(await resStr, callbacks);
  } else {
    return resStr;
  }
};

// ../../node_modules/hono/dist/context.js
var TEXT_PLAIN = "text/plain; charset=UTF-8";
var setDefaultContentType = (contentType, headers) => {
  return {
    "Content-Type": contentType,
    ...headers
  };
};
var createResponseInstance = (body, init) => new Response(body, init);
var Context = class {
  #rawRequest;
  #req;
  /**
   * `.env` can get bindings (environment variables, secrets, KV namespaces, D1 database, R2 bucket etc.) in Cloudflare Workers.
   *
   * @see {@link https://hono.dev/docs/api/context#env}
   *
   * @example
   * ```ts
   * // Environment object for Cloudflare Workers
   * app.get('*', async c => {
   *   const counter = c.env.COUNTER
   * })
   * ```
   */
  env = {};
  #var;
  finalized = false;
  /**
   * `.error` can get the error object from the middleware if the Handler throws an error.
   *
   * @see {@link https://hono.dev/docs/api/context#error}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   await next()
   *   if (c.error) {
   *     // do something...
   *   }
   * })
   * ```
   */
  error;
  #status;
  #executionCtx;
  #res;
  #layout;
  #renderer;
  #notFoundHandler;
  #preparedHeaders;
  #matchResult;
  #path;
  /**
   * Creates an instance of the Context class.
   *
   * @param req - The Request object.
   * @param options - Optional configuration options for the context.
   */
  constructor(req, options) {
    this.#rawRequest = req;
    if (options) {
      this.#executionCtx = options.executionCtx;
      this.env = options.env;
      this.#notFoundHandler = options.notFoundHandler;
      this.#path = options.path;
      this.#matchResult = options.matchResult;
    }
  }
  /**
   * `.req` is the instance of {@link HonoRequest}.
   */
  get req() {
    this.#req ??= new HonoRequest(this.#rawRequest, this.#path, this.#matchResult);
    return this.#req;
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#event}
   * The FetchEvent associated with the current request.
   *
   * @throws Will throw an error if the context does not have a FetchEvent.
   */
  get event() {
    if (this.#executionCtx && "respondWith" in this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no FetchEvent");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#executionctx}
   * The ExecutionContext associated with the current request.
   *
   * @throws Will throw an error if the context does not have an ExecutionContext.
   */
  get executionCtx() {
    if (this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no ExecutionContext");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#res}
   * The Response object for the current request.
   */
  get res() {
    return this.#res ||= createResponseInstance(null, {
      headers: this.#preparedHeaders ??= new Headers()
    });
  }
  /**
   * Sets the Response object for the current request.
   *
   * @param _res - The Response object to set.
   */
  set res(_res) {
    if (this.#res && _res) {
      _res = createResponseInstance(_res.body, _res);
      for (const [k, v] of this.#res.headers.entries()) {
        if (k === "content-type") {
          continue;
        }
        if (k === "set-cookie") {
          const cookies = this.#res.headers.getSetCookie();
          _res.headers.delete("set-cookie");
          for (const cookie of cookies) {
            _res.headers.append("set-cookie", cookie);
          }
        } else {
          _res.headers.set(k, v);
        }
      }
    }
    this.#res = _res;
    this.finalized = true;
  }
  /**
   * `.render()` can create a response within a layout.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   return c.render('Hello!')
   * })
   * ```
   */
  render = (...args) => {
    this.#renderer ??= (content) => this.html(content);
    return this.#renderer(...args);
  };
  /**
   * Sets the layout for the response.
   *
   * @param layout - The layout to set.
   * @returns The layout function.
   */
  setLayout = (layout) => this.#layout = layout;
  /**
   * Gets the current layout for the response.
   *
   * @returns The current layout function.
   */
  getLayout = () => this.#layout;
  /**
   * `.setRenderer()` can set the layout in the custom middleware.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```tsx
   * app.use('*', async (c, next) => {
   *   c.setRenderer((content) => {
   *     return c.html(
   *       <html>
   *         <body>
   *           <p>{content}</p>
   *         </body>
   *       </html>
   *     )
   *   })
   *   await next()
   * })
   * ```
   */
  setRenderer = (renderer) => {
    this.#renderer = renderer;
  };
  /**
   * `.header()` can set headers.
   *
   * @see {@link https://hono.dev/docs/api/context#header}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *
   *   // Append multiple headers using the append option (e.g. Vary)
   *   c.header('Vary', 'Accept-Encoding', { append: true })
   *   c.header('Vary', 'User-Agent', { append: true })
   *
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  header = (name, value, options) => {
    if (this.finalized) {
      this.#res = createResponseInstance(this.#res.body, this.#res);
    }
    const headers = this.#res ? this.#res.headers : this.#preparedHeaders ??= new Headers();
    if (value === void 0) {
      headers.delete(name);
    } else if (options?.append) {
      headers.append(name, value);
    } else {
      headers.set(name, value);
    }
  };
  status = (status) => {
    this.#status = status;
  };
  /**
   * `.set()` can set the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   c.set('message', 'Hono is hot!!')
   *   await next()
   * })
   * ```
   */
  set = (key, value) => {
    this.#var ??= /* @__PURE__ */ new Map();
    this.#var.set(key, value);
  };
  /**
   * `.get()` can use the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   const message = c.get('message')
   *   return c.text(`The message is "${message}"`)
   * })
   * ```
   */
  get = (key) => {
    return this.#var ? this.#var.get(key) : void 0;
  };
  /**
   * `.var` can access the value of a variable.
   *
   * @see {@link https://hono.dev/docs/api/context#var}
   *
   * @example
   * ```ts
   * const result = c.var.client.oneMethod()
   * ```
   */
  // c.var.propName is a read-only
  get var() {
    if (!this.#var) {
      return {};
    }
    return Object.fromEntries(this.#var);
  }
  #newResponse(data, arg, headers) {
    let responseHeaders = this.#res ? new Headers(this.#res.headers) : this.#preparedHeaders;
    if (typeof arg === "object" && arg.headers) {
      responseHeaders ??= new Headers();
      for (const [key, value] of new Headers(arg.headers)) {
        if (key === "set-cookie") {
          responseHeaders.append(key, value);
        } else {
          responseHeaders.set(key, value);
        }
      }
    }
    if (headers) {
      if (!responseHeaders) {
        let count = 0;
        for (const k in headers) {
          if (++count > 1 || typeof headers[k] !== "string") {
            responseHeaders = new Headers();
            break;
          }
        }
      }
      if (responseHeaders) {
        for (const k in headers) {
          const v = headers[k];
          if (typeof v === "string") {
            responseHeaders.set(k, v);
          } else {
            responseHeaders.delete(k);
            for (const v2 of v) {
              responseHeaders.append(k, v2);
            }
          }
        }
      }
    }
    const status = typeof arg === "number" ? arg : arg?.status ?? this.#status;
    return createResponseInstance(data, {
      status,
      headers: responseHeaders ?? headers
    });
  }
  newResponse = (...args) => this.#newResponse(...args);
  /**
   * `.body()` can return the HTTP response.
   * You can set headers with `.header()` and set HTTP status code with `.status`.
   * This can also be set in `.text()`, `.json()` and so on.
   *
   * @see {@link https://hono.dev/docs/api/context#body}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *   // Set HTTP status code
   *   c.status(201)
   *
   *   // Return the response body
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  body = (data, arg, headers) => this.#newResponse(data, arg, headers);
  /**
   * `.text()` can render text as `Content-Type:text/plain`.
   *
   * @see {@link https://hono.dev/docs/api/context#text}
   *
   * @example
   * ```ts
   * app.get('/say', (c) => {
   *   return c.text('Hello!')
   * })
   * ```
   */
  text = (text, arg, headers) => {
    return !this.#preparedHeaders && !this.#status && !arg && !headers && !this.finalized ? new Response(text) : this.#newResponse(
      text,
      arg,
      setDefaultContentType(TEXT_PLAIN, headers)
    );
  };
  /**
   * `.json()` can render JSON as `Content-Type:application/json`.
   *
   * @see {@link https://hono.dev/docs/api/context#json}
   *
   * @example
   * ```ts
   * app.get('/api', (c) => {
   *   return c.json({ message: 'Hello!' })
   * })
   * ```
   */
  json = (object, arg, headers) => {
    return this.#newResponse(
      JSON.stringify(object),
      arg,
      setDefaultContentType("application/json", headers)
    );
  };
  html = (html, arg, headers) => {
    const res = (html2) => this.#newResponse(html2, arg, setDefaultContentType("text/html; charset=UTF-8", headers));
    return typeof html === "object" ? resolveCallback(html, HtmlEscapedCallbackPhase.Stringify, false, {}).then(res) : res(html);
  };
  /**
   * `.redirect()` can Redirect, default status code is 302.
   *
   * @see {@link https://hono.dev/docs/api/context#redirect}
   *
   * @example
   * ```ts
   * app.get('/redirect', (c) => {
   *   return c.redirect('/')
   * })
   * app.get('/redirect-permanently', (c) => {
   *   return c.redirect('/', 301)
   * })
   * ```
   */
  redirect = (location, status) => {
    const locationString = String(location);
    this.header(
      "Location",
      // Multibyes should be encoded
      // eslint-disable-next-line no-control-regex
      !/[^\x00-\xFF]/.test(locationString) ? locationString : encodeURI(locationString)
    );
    return this.newResponse(null, status ?? 302);
  };
  /**
   * `.notFound()` can return the Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/context#notfound}
   *
   * @example
   * ```ts
   * app.get('/notfound', (c) => {
   *   return c.notFound()
   * })
   * ```
   */
  notFound = () => {
    this.#notFoundHandler ??= () => createResponseInstance();
    return this.#notFoundHandler(this);
  };
};

// ../../node_modules/hono/dist/router.js
var METHOD_NAME_ALL = "ALL";
var METHOD_NAME_ALL_LOWERCASE = "all";
var METHODS = ["get", "post", "put", "delete", "options", "patch", "query"];
var MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
var UnsupportedPathError = class extends Error {
};

// ../../node_modules/hono/dist/utils/constants.js
var COMPOSED_HANDLER = "__COMPOSED_HANDLER";

// ../../node_modules/hono/dist/hono-base.js
var notFoundHandler = (c) => {
  return c.text("404 Not Found", 404);
};
var errorHandler = (err, c) => {
  if ("getResponse" in err) {
    const res = err.getResponse();
    return c.newResponse(res.body, res);
  }
  console.error(err);
  return c.text("Internal Server Error", 500);
};
var Hono = class _Hono {
  get;
  post;
  put;
  delete;
  options;
  patch;
  query;
  all;
  on;
  use;
  /*
    This class is like an abstract class and does not have a router.
    To use it, inherit the class and implement router in the constructor.
  */
  router;
  getPath;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  _basePath = "/";
  #path = "/";
  routes = [];
  constructor(options = {}) {
    const allMethods = [...METHODS, METHOD_NAME_ALL_LOWERCASE];
    allMethods.forEach((method) => {
      this[method] = (args1, ...args) => {
        if (typeof args1 === "string") {
          this.#path = args1;
        } else {
          this.#addRoute(method, this.#path, args1);
        }
        args.forEach((handler) => {
          this.#addRoute(method, this.#path, handler);
        });
        return this;
      };
    });
    this.on = (method, path, ...handlers) => {
      for (const p of [path].flat()) {
        this.#path = p;
        for (const m of [method].flat()) {
          handlers.map((handler) => {
            this.#addRoute(m.toUpperCase(), this.#path, handler);
          });
        }
      }
      return this;
    };
    this.use = (arg1, ...handlers) => {
      if (typeof arg1 === "string") {
        this.#path = arg1;
      } else {
        this.#path = "*";
        handlers.unshift(arg1);
      }
      handlers.forEach((handler) => {
        this.#addRoute(METHOD_NAME_ALL, this.#path, handler);
      });
      return this;
    };
    const { strict, ...optionsWithoutStrict } = options;
    Object.assign(this, optionsWithoutStrict);
    this.getPath = strict ?? true ? options.getPath ?? getPath : getPathNoStrict;
  }
  #clone() {
    const clone = new _Hono({
      router: this.router,
      getPath: this.getPath
    });
    clone.errorHandler = this.errorHandler;
    clone.#notFoundHandler = this.#notFoundHandler;
    clone.routes = this.routes;
    return clone;
  }
  #notFoundHandler = notFoundHandler;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  errorHandler = errorHandler;
  /**
   * `.route()` allows grouping other Hono instance in routes.
   *
   * @see {@link https://hono.dev/docs/api/routing#grouping}
   *
   * @param {string} path - base Path
   * @param {Hono} app - other Hono instance
   * @returns {Hono} routed Hono instance
   *
   * @example
   * ```ts
   * const app = new Hono()
   * const app2 = new Hono()
   *
   * app2.get("/user", (c) => c.text("user"))
   * app.route("/api", app2) // GET /api/user
   * ```
   */
  route(path, app2) {
    const subApp = this.basePath(path);
    app2.routes.map((r) => {
      let handler;
      if (app2.errorHandler === errorHandler) {
        handler = r.handler;
      } else {
        handler = async (c, next) => (await compose([], app2.errorHandler)(c, () => r.handler(c, next))).res;
        handler[COMPOSED_HANDLER] = r.handler;
      }
      subApp.#addRoute(r.method, r.path, handler, r.basePath);
    });
    return this;
  }
  /**
   * `.basePath()` allows base paths to be specified.
   *
   * @see {@link https://hono.dev/docs/api/routing#base-path}
   *
   * @param {string} path - base Path
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * const api = new Hono().basePath('/api')
   * ```
   */
  basePath(path) {
    const subApp = this.#clone();
    subApp._basePath = mergePath(this._basePath, path);
    return subApp;
  }
  /**
   * `.onError()` handles an error and returns a customized Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#error-handling}
   *
   * @param {ErrorHandler} handler - request Handler for error
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.onError((err, c) => {
   *   console.error(`${err}`)
   *   return c.text('Custom Error Message', 500)
   * })
   * ```
   */
  onError = (handler) => {
    this.errorHandler = handler;
    return this;
  };
  /**
   * `.notFound()` allows you to customize a Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#not-found}
   *
   * @param {NotFoundHandler} handler - request handler for not-found
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.notFound((c) => {
   *   return c.text('Custom 404 Message', 404)
   * })
   * ```
   */
  notFound = (handler) => {
    this.#notFoundHandler = handler;
    return this;
  };
  /**
   * `.mount()` allows you to mount applications built with other frameworks into your Hono application.
   *
   * @see {@link https://hono.dev/docs/api/hono#mount}
   *
   * @param {string} path - base Path
   * @param {Function} applicationHandler - other Request Handler
   * @param {MountOptions} [options] - options of `.mount()`
   * @returns {Hono} mounted Hono instance
   *
   * @example
   * ```ts
   * import { Router as IttyRouter } from 'itty-router'
   * import { Hono } from 'hono'
   * // Create itty-router application
   * const ittyRouter = IttyRouter()
   * // GET /itty-router/hello
   * ittyRouter.get('/hello', () => new Response('Hello from itty-router'))
   *
   * const app = new Hono()
   * app.mount('/itty-router', ittyRouter.handle)
   * ```
   *
   * @example
   * ```ts
   * const app = new Hono()
   * // Send the request to another application without modification.
   * app.mount('/app', anotherApp, {
   *   replaceRequest: (req) => req,
   * })
   * ```
   */
  mount(path, applicationHandler, options) {
    let replaceRequest;
    let optionHandler;
    if (options) {
      if (typeof options === "function") {
        optionHandler = options;
      } else {
        optionHandler = options.optionHandler;
        if (options.replaceRequest === false) {
          replaceRequest = (request) => request;
        } else {
          replaceRequest = options.replaceRequest;
        }
      }
    }
    const getOptions = optionHandler ? (c) => {
      const options2 = optionHandler(c);
      return Array.isArray(options2) ? options2 : [options2];
    } : (c) => {
      let executionContext = void 0;
      try {
        executionContext = c.executionCtx;
      } catch {
      }
      return [c.env, executionContext];
    };
    replaceRequest ||= (() => {
      const mergedPath = mergePath(this._basePath, path);
      const pathPrefixLength = mergedPath === "/" ? 0 : mergedPath.length;
      return (request) => {
        const url = new URL(request.url);
        url.pathname = this.getPath(request).slice(pathPrefixLength) || "/";
        return new Request(url, request);
      };
    })();
    const handler = async (c, next) => {
      const res = await applicationHandler(replaceRequest(c.req.raw), ...getOptions(c));
      if (res) {
        return res;
      }
      await next();
    };
    this.#addRoute(METHOD_NAME_ALL, mergePath(path, "*"), handler);
    return this;
  }
  #addRoute(method, path, handler, baseRoutePath) {
    method = method.toUpperCase();
    path = mergePath(this._basePath, path);
    const r = {
      basePath: baseRoutePath !== void 0 ? mergePath(this._basePath, baseRoutePath) : this._basePath,
      path,
      method,
      handler
    };
    this.router.add(method, path, [handler, r]);
    this.routes.push(r);
  }
  #handleError(err, c) {
    if (err instanceof Error) {
      return this.errorHandler(err, c);
    }
    throw err;
  }
  #dispatch(request, executionCtx, env, method) {
    if (method === "HEAD") {
      return (async () => new Response(null, await this.#dispatch(request, executionCtx, env, "GET")))();
    }
    const path = this.getPath(request, { env });
    const matchResult = this.router.match(method, path);
    const c = new Context(request, {
      path,
      matchResult,
      env,
      executionCtx,
      notFoundHandler: this.#notFoundHandler
    });
    if (matchResult[0].length === 1) {
      let res;
      try {
        res = matchResult[0][0][0][0](c, async () => {
          c.res = await this.#notFoundHandler(c);
        });
      } catch (err) {
        return this.#handleError(err, c);
      }
      return res instanceof Promise ? res.then(
        (resolved) => resolved || (c.finalized ? c.res : this.#notFoundHandler(c))
      ).catch((err) => this.#handleError(err, c)) : res ?? this.#notFoundHandler(c);
    }
    const composed = compose(matchResult[0], this.errorHandler, this.#notFoundHandler);
    return (async () => {
      try {
        const context = await composed(c);
        if (!context.finalized) {
          throw new Error(
            "Context is not finalized. Did you forget to return a Response object or `await next()`?"
          );
        }
        return context.res;
      } catch (err) {
        return this.#handleError(err, c);
      }
    })();
  }
  /**
   * `.fetch()` will be entry point of your app.
   *
   * @see {@link https://hono.dev/docs/api/hono#fetch}
   *
   * @param {Request} request - request Object of request
   * @param {Env} env - env Object
   * @param {ExecutionContext} executionCtx - context of execution
   * @returns {Response | Promise<Response>} response of request
   *
   */
  fetch = (request, ...rest) => {
    return this.#dispatch(request, rest[1], rest[0], request.method);
  };
  /**
   * `.request()` is a useful method for testing.
   * You can pass a URL or pathname to send a GET request.
   * app will return a Response object.
   * ```ts
   * test('GET /hello is ok', async () => {
   *   const res = await app.request('/hello')
   *   expect(res.status).toBe(200)
   * })
   * ```
   * @see https://hono.dev/docs/api/hono#request
   */
  request = (input, requestInit, Env, executionCtx) => {
    if (input instanceof Request) {
      return this.fetch(requestInit ? new Request(input, requestInit) : input, Env, executionCtx);
    }
    input = input.toString();
    return this.fetch(
      new Request(
        /^https?:\/\//.test(input) ? input : `http://localhost${mergePath("/", input)}`,
        requestInit
      ),
      Env,
      executionCtx
    );
  };
  /**
   * `.fire()` automatically adds a global fetch event listener.
   * This can be useful for environments that adhere to the Service Worker API, such as non-ES module Cloudflare Workers.
   * @deprecated
   * Use `fire` from `hono/service-worker` instead.
   * ```ts
   * import { Hono } from 'hono'
   * import { fire } from 'hono/service-worker'
   *
   * const app = new Hono()
   * // ...
   * fire(app)
   * ```
   * @see https://hono.dev/docs/api/hono#fire
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
   * @see https://developers.cloudflare.com/workers/reference/migrate-to-module-workers/
   */
  fire = () => {
    addEventListener("fetch", (event) => {
      event.respondWith(this.#dispatch(event.request, event, void 0, event.request.method));
    });
  };
};

// ../../node_modules/hono/dist/router/utils.js
var createNullObject = () => /* @__PURE__ */ Object.create(null);

// ../../node_modules/hono/dist/router/reg-exp-router/matcher.js
var emptyParam = [];
function match(method, path) {
  const matchers = this.buildAllMatchers();
  const match2 = ((method2, path2) => {
    const matcher = matchers[method2] || matchers[METHOD_NAME_ALL];
    const staticMatch = matcher[2][path2];
    if (staticMatch) {
      return staticMatch;
    }
    const match3 = path2.match(matcher[0]);
    if (!match3) {
      return [[], emptyParam];
    }
    const index = match3.indexOf("", 1);
    return [matcher[1][index], match3];
  });
  this.match = match2;
  return match2(method, path);
}

// ../../node_modules/hono/dist/router/reg-exp-router/node.js
var LABEL_REG_EXP_STR = "[^/]+";
var ONLY_WILDCARD_REG_EXP_STR = ".*";
var TAIL_WILDCARD_REG_EXP_STR = "(?:|/.*)";
var PATH_ERROR = /* @__PURE__ */ Symbol();
var regExpMetaChars = new Set(".\\+*[^]$()");
function compareKey(a, b) {
  if (a.length === 1) {
    return b.length === 1 ? a < b ? -1 : 1 : -1;
  }
  if (b.length === 1) {
    return 1;
  }
  if (a === ONLY_WILDCARD_REG_EXP_STR || a === TAIL_WILDCARD_REG_EXP_STR) {
    return b === TAIL_WILDCARD_REG_EXP_STR ? -1 : 1;
  } else if (b === ONLY_WILDCARD_REG_EXP_STR || b === TAIL_WILDCARD_REG_EXP_STR) {
    return -1;
  }
  if (a === LABEL_REG_EXP_STR) {
    return 1;
  } else if (b === LABEL_REG_EXP_STR) {
    return -1;
  }
  return a.length === b.length ? a < b ? -1 : 1 : b.length - a.length;
}
var Node = class _Node {
  // handler index of a dynamic path, or -1 for a static path terminal
  #index;
  #varIndex;
  #children = createNullObject();
  insert(tokens, index, paramMap, context, isStatic) {
    let node = this;
    for (let i = 0, len = tokens.length; i < len; i++) {
      const token = tokens[i];
      const pattern = token.length === 1 ? token === "*" ? i === len - 1 ? ["", "", ONLY_WILDCARD_REG_EXP_STR] : ["", "", LABEL_REG_EXP_STR] : null : token === "/*" ? ["", "", TAIL_WILDCARD_REG_EXP_STR] : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
      let nextNode;
      if (pattern) {
        const name = pattern[1];
        let regexpStr = pattern[2] || LABEL_REG_EXP_STR;
        if (name && pattern[2]) {
          if (regexpStr === ".*") {
            throw PATH_ERROR;
          }
          regexpStr = regexpStr.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
          if (/\((?!\?:)/.test(regexpStr)) {
            throw PATH_ERROR;
          }
          if (regexpStr.length === 1 && regExpMetaChars.has(regexpStr)) {
            throw PATH_ERROR;
          }
        }
        nextNode = node.#children[regexpStr];
        if (!nextNode) {
          if (regexpStr !== ONLY_WILDCARD_REG_EXP_STR && regexpStr !== TAIL_WILDCARD_REG_EXP_STR) {
            for (const k in node.#children) {
              if (
                // a single-char pattern coexists with single-char literals as a literal does
                (regexpStr.length > 1 || k.length > 1) && k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
              ) {
                throw PATH_ERROR;
              }
            }
          }
          nextNode = node.#children[regexpStr] = new _Node();
        }
        if (name !== "") {
          nextNode.#varIndex ??= context.varIndex++;
          paramMap.push([name, nextNode.#varIndex]);
        }
      } else {
        nextNode = node.#children[token];
        if (!nextNode) {
          for (const k in node.#children) {
            if (k.length > 1 && k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR) {
              throw PATH_ERROR;
            }
          }
          nextNode = node.#children[token] = new _Node();
        }
      }
      node = nextNode;
    }
    if (node.#index !== void 0) {
      throw PATH_ERROR;
    }
    node.#index = isStatic ? -1 : index;
  }
  buildRegExpStr() {
    const childKeys = Object.keys(this.#children).sort(compareKey);
    const strList = childKeys.map((k) => {
      const c = this.#children[k];
      const childStr = c.buildRegExpStr();
      return childStr === "" ? "" : (typeof c.#varIndex === "number" ? `(${k})@${c.#varIndex}` : regExpMetaChars.has(k) ? `\\${k}` : k) + childStr;
    }).filter(Boolean);
    if (typeof this.#index === "number" && this.#index !== -1) {
      strList.unshift(`#${this.#index}`);
    }
    if (strList.length === 0) {
      return "";
    }
    if (strList.length === 1) {
      return strList[0];
    }
    return "(?:" + strList.join("|") + ")";
  }
};

// ../../node_modules/hono/dist/router/reg-exp-router/trie.js
var Trie = class {
  #context = { varIndex: 0 };
  #root = new Node();
  #index = 0;
  // dynamic path -> [handler index, param assoc]; static paths are not registered
  paths = createNullObject();
  insert(path, isStatic) {
    if (isStatic) {
      this.#root.insert(path.split(""), 0, [], this.#context, true);
      return;
    }
    const paramAssoc = [];
    const groups = [];
    let markedPath = path;
    for (let i = 0; ; ) {
      let replaced = false;
      markedPath = markedPath.replace(/\{[^}]+\}/g, (m) => {
        const mark = `@\\${i}`;
        groups[i] = [mark, m];
        i++;
        replaced = true;
        return mark;
      });
      if (!replaced) {
        break;
      }
    }
    const tokens = markedPath.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
    for (let i = groups.length - 1; i >= 0; i--) {
      const [mark] = groups[i];
      for (let j = tokens.length - 1; j >= 0; j--) {
        if (tokens[j].indexOf(mark) !== -1) {
          tokens[j] = tokens[j].replace(mark, groups[i][1]);
          break;
        }
      }
    }
    this.#root.insert(tokens, this.#index, paramAssoc, this.#context, false);
    this.paths[path] = [this.#index++, paramAssoc];
  }
  buildRegExp() {
    let regexp = this.#root.buildRegExpStr();
    if (regexp === "") {
      return [/^$/, [], []];
    }
    let captureIndex = 0;
    const indexReplacementMap = [];
    const paramReplacementMap = [];
    regexp = regexp.replace(/#(\d+)|@(\d+)|\.\*\$/g, (_, handlerIndex, paramIndex) => {
      if (handlerIndex !== void 0) {
        indexReplacementMap[++captureIndex] = Number(handlerIndex);
        return "$()";
      }
      if (paramIndex !== void 0) {
        paramReplacementMap[Number(paramIndex)] = ++captureIndex;
        return "";
      }
      return "";
    });
    return [new RegExp(`^${regexp}`), indexReplacementMap, paramReplacementMap];
  }
};

// ../../node_modules/hono/dist/router/reg-exp-router/router.js
var wildcardRegExpCache = createNullObject();
function buildWildcardRegExp(path) {
  return wildcardRegExpCache[path] ??= new RegExp(
    `^${path.replace(
      /\/:[^/{}]+(?:\{\[\^\/]\+})?(?=[/{]|$)|\/?\*$|([.\\+*[^\]$()?{}|])/g,
      (match2, metaChar) => metaChar ? `\\${metaChar}` : match2 === "/*" ? TAIL_WILDCARD_REG_EXP_STR : match2 === "*" ? ONLY_WILDCARD_REG_EXP_STR : `/:${LABEL_REG_EXP_STR}`
    )}$`
  );
}
function findMiddleware(middleware, path) {
  for (const k of Object.keys(middleware).sort((a, b) => b.length - a.length)) {
    if (buildWildcardRegExp(k).test(path)) {
      return [...middleware[k]];
    }
  }
  return void 0;
}
var RegExpRouter = class {
  name = "RegExpRouter";
  #middleware;
  #routes;
  #tries;
  constructor() {
    this.#middleware = { [METHOD_NAME_ALL]: createNullObject() };
    this.#routes = { [METHOD_NAME_ALL]: createNullObject() };
    this.#tries = { [METHOD_NAME_ALL]: new Trie() };
  }
  #insertPath(method, path) {
    try {
      this.#tries[method].insert(path, !/\*|\/:/.test(path));
    } catch (e) {
      throw e === PATH_ERROR ? new UnsupportedPathError(path) : e;
    }
  }
  add(method, path, handler) {
    const middleware = this.#middleware;
    const routes = this.#routes;
    if (!middleware) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    if (!middleware[method]) {
      this.#tries[method] = new Trie();
      for (const handlerMap of [middleware, routes]) {
        handlerMap[method] = createNullObject();
        for (const p in handlerMap[METHOD_NAME_ALL]) {
          handlerMap[method][p] = [...handlerMap[METHOD_NAME_ALL][p]];
          this.#insertPath(method, p);
        }
      }
    }
    if (path === "/*") {
      path = "*";
    }
    const methods = method === METHOD_NAME_ALL ? Object.keys(middleware) : [method];
    if (/\*$/.test(path)) {
      const re = buildWildcardRegExp(path);
      for (const m of methods) {
        if (!middleware[m][path]) {
          this.#insertPath(m, path);
          middleware[m][path] = findMiddleware(middleware[m], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
        }
      }
      for (const handlerMap of [middleware, routes]) {
        for (const m of methods) {
          for (const p in handlerMap[m]) {
            re.test(p) && handlerMap[m][p].push([handler, path]);
          }
        }
      }
      return;
    }
    const paths = checkOptionalParameter(path) || [path];
    for (const path2 of paths) {
      for (const m of methods) {
        if (!routes[m][path2]) {
          this.#insertPath(m, path2);
          routes[m][path2] = findMiddleware(middleware[m], path2) || findMiddleware(middleware[METHOD_NAME_ALL], path2) || [];
        }
        routes[m][path2].push([handler, path2]);
      }
    }
  }
  match = match;
  buildAllMatchers() {
    const matchers = createNullObject();
    for (const method of Object.keys(this.#routes)) {
      matchers[method] = this.#buildMatcher(method);
    }
    this.#middleware = this.#routes = this.#tries = void 0;
    wildcardRegExpCache = createNullObject();
    return matchers;
  }
  #buildMatcher(method) {
    const middleware = this.#middleware[method];
    const routes = this.#routes[method];
    const trie = this.#tries[method];
    const staticMap = createNullObject();
    const handlerData = [];
    const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
    for (const r of [middleware, routes]) {
      for (const path in r) {
        const handlers = r[path];
        const pathData = trie.paths[path];
        if (!pathData) {
          staticMap[path] = [handlers.map(([h]) => [h, createNullObject()]), emptyParam];
          continue;
        }
        handlerData[pathData[0]] = handlers.map(([h, handlerPath]) => [
          h,
          trie.paths[handlerPath][1].reduceRight((map, [key], i) => {
            map[key] = paramReplacementMap[pathData[1][i][1]];
            return map;
          }, createNullObject())
        ]);
      }
    }
    return [regexp, indexReplacementMap.map((i) => handlerData[i]), staticMap];
  }
};

// ../../node_modules/hono/dist/router/smart-router/router.js
var SmartRouter = class {
  name = "SmartRouter";
  #routers = [];
  #routes = [];
  constructor(init) {
    this.#routers = init.routers;
  }
  add(method, path, handler) {
    if (!this.#routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    this.#routes.push([method, path, handler]);
  }
  match(method, path) {
    if (!this.#routes) {
      throw new Error("Fatal error");
    }
    const routers = this.#routers;
    const routes = this.#routes;
    const len = routers.length;
    let i = 0;
    let res;
    for (; i < len; i++) {
      const router = routers[i];
      try {
        for (let i2 = 0, len2 = routes.length; i2 < len2; i2++) {
          router.add(...routes[i2]);
        }
        res = router.match(method, path);
      } catch (e) {
        if (e instanceof UnsupportedPathError) {
          continue;
        }
        throw e;
      }
      this.match = router.match.bind(router);
      this.#routers = [router];
      this.#routes = void 0;
      break;
    }
    if (i === len) {
      throw new Error("Fatal error");
    }
    this.name = `SmartRouter + ${this.activeRouter.name}`;
    return res;
  }
  get activeRouter() {
    if (this.#routes || this.#routers.length !== 1) {
      throw new Error("No active router has been determined yet.");
    }
    return this.#routers[0];
  }
};

// ../../node_modules/hono/dist/router/trie-router/node.js
var emptyParams = createNullObject();
var order = 0;
var Node2 = class _Node2 {
  #methods = [];
  #children = createNullObject();
  #patterns = [];
  #pattern;
  #params = emptyParams;
  insert(method, path, handler) {
    let curNode = this;
    const parts = splitRoutingPath(path);
    const possibleKeys = /* @__PURE__ */ new Set();
    let i = 0;
    for (const p of parts) {
      const nextP = parts[++i];
      const pattern = getPattern(p, nextP) || (nextP === void 0 && p && p.indexOf("*") === p.length - 1 ? p : null);
      const isParam = Array.isArray(pattern);
      const key = isParam ? pattern[0] : pattern || p;
      const child = curNode.#children[key] ||= new _Node2();
      if (pattern && !child.#pattern) {
        child.#pattern = pattern;
        curNode.#patterns.push(child);
      }
      curNode = child;
      if (isParam) {
        possibleKeys.add(pattern[1]);
      }
    }
    curNode.#methods.push({
      [method]: {
        handler,
        possibleKeys: [...possibleKeys],
        score: ++order
      }
    });
  }
  #pushHandlerSets(handlerSets, node, method, nodeParams, params) {
    for (let i = 0, len = node.#methods.length; i < len; i++) {
      const m = node.#methods[i];
      const handlerSet = m[method] || m[METHOD_NAME_ALL];
      if (handlerSet) {
        handlerSet.params = createNullObject();
        handlerSets.push(handlerSet);
        for (let i2 = 0, len2 = handlerSet.possibleKeys.length; i2 < len2; i2++) {
          const key = handlerSet.possibleKeys[i2];
          handlerSet.params[key] = params?.[key] && !i2 ? params[key] : nodeParams[key] ?? params?.[key];
        }
      }
    }
  }
  search(method, path) {
    const handlerSets = [];
    this.#params = emptyParams;
    const curNode = this;
    let curNodes = [curNode];
    const parts = splitPath(path);
    const curNodesQueue = [];
    const len = parts.length;
    let partOffsets = null;
    for (let i = 0; i < len; i++) {
      const part = parts[i];
      const isLast = i === len - 1;
      const tempNodes = [];
      for (let j = 0, len2 = curNodes.length; j < len2; j++) {
        const node = curNodes[j];
        const nextNode = node.#children[part];
        if (nextNode) {
          nextNode.#params = node.#params;
          if (isLast) {
            if (nextNode.#children["*"]) {
              this.#pushHandlerSets(handlerSets, nextNode.#children["*"], method, node.#params);
            }
            this.#pushHandlerSets(handlerSets, nextNode, method, node.#params);
          } else {
            tempNodes.push(nextNode);
          }
        }
        for (const child of node.#patterns) {
          const pattern = child.#pattern;
          const params = node.#params === emptyParams ? {} : { ...node.#params };
          if (typeof pattern === "string") {
            if (pattern === "*" || part.startsWith(pattern.slice(0, -1))) {
              this.#pushHandlerSets(handlerSets, child, method, node.#params);
              if (pattern === "*") {
                child.#params = params;
                tempNodes.push(child);
              }
            }
            continue;
          }
          const [, name, matcher] = pattern;
          if (!part && matcher === true) {
            continue;
          }
          if (matcher !== true) {
            if (!partOffsets) {
              partOffsets = [];
              let offset = path[0] === "/" ? 1 : 0;
              for (let p = 0; p < len; p++) {
                partOffsets[p] = offset;
                offset += parts[p].length + 1;
              }
            }
            const restPathString = path.slice(partOffsets[i]);
            const m = matcher.exec(restPathString);
            if (m) {
              params[name] = m[0];
              this.#pushHandlerSets(handlerSets, child, method, node.#params, params);
              if (m[0].length === restPathString.length && child.#children["*"]) {
                this.#pushHandlerSets(
                  handlerSets,
                  child.#children["*"],
                  method,
                  node.#params,
                  params
                );
              }
              for (const _ in child.#children) {
                child.#params = params;
                const componentCount = m[0].match(/\//g)?.length ?? 0;
                const targetCurNodes = curNodesQueue[componentCount] ||= [];
                targetCurNodes.push(child);
                break;
              }
              continue;
            }
          }
          if (matcher === true || matcher.test(part)) {
            params[name] = part;
            if (isLast) {
              this.#pushHandlerSets(handlerSets, child, method, params, node.#params);
              if (child.#children["*"]) {
                this.#pushHandlerSets(
                  handlerSets,
                  child.#children["*"],
                  method,
                  params,
                  node.#params
                );
              }
            } else {
              child.#params = params;
              tempNodes.push(child);
            }
          }
        }
      }
      const shifted = curNodesQueue.shift();
      curNodes = shifted ? tempNodes.concat(shifted) : tempNodes;
    }
    if (handlerSets[1]) {
      handlerSets.sort((a, b) => {
        return a.score - b.score;
      });
    }
    return [handlerSets.map(({ handler, params }) => [handler, params])];
  }
};

// ../../node_modules/hono/dist/router/trie-router/router.js
var TrieRouter = class {
  name = "TrieRouter";
  #node = new Node2();
  add(method, path, handler) {
    for (const result of checkOptionalParameter(path) || [path]) {
      this.#node.insert(method, result, handler);
    }
  }
  match(method, path) {
    return this.#node.search(method, path);
  }
};

// ../../node_modules/hono/dist/hono.js
var Hono2 = class extends Hono {
  /**
   * Creates an instance of the Hono class.
   *
   * @param options - Optional configuration options for the Hono instance.
   */
  constructor(options = {}) {
    super(options);
    this.router = options.router ?? new SmartRouter({
      routers: [new RegExpRouter(), new TrieRouter()]
    });
  }
};

// ../../node_modules/hono/dist/middleware/cors/index.js
var cors = (options) => {
  const opts = {
    origin: "*",
    allowMethods: ["GET", "HEAD", "PUT", "POST", "DELETE", "PATCH", "QUERY"],
    allowHeaders: [],
    exposeHeaders: [],
    ...options
  };
  const exposeHeadersStr = opts.exposeHeaders?.length ? opts.exposeHeaders.join(",") : void 0;
  const allowHeadersStr = opts.allowHeaders?.length ? opts.allowHeaders.join(",") : void 0;
  const findAllowOrigin = ((optsOrigin) => {
    if (typeof optsOrigin === "string") {
      if (optsOrigin === "*") {
        return () => optsOrigin;
      } else {
        return (origin) => optsOrigin === origin ? origin : null;
      }
    } else if (typeof optsOrigin === "function") {
      return optsOrigin;
    } else {
      return (origin) => optsOrigin.includes(origin) ? origin : null;
    }
  })(opts.origin);
  const findAllowMethods = ((optsAllowMethods) => {
    if (typeof optsAllowMethods === "function") {
      return async (origin, c) => (await optsAllowMethods(origin, c)).join(",");
    } else if (Array.isArray(optsAllowMethods)) {
      const methodsStr = optsAllowMethods.join(",");
      return () => methodsStr;
    } else {
      return () => "";
    }
  })(opts.allowMethods);
  return async function cors2(c, next) {
    function set(key, value) {
      c.res.headers.set(key, value);
    }
    const allowOrigin = await findAllowOrigin(c.req.header("origin") || "", c);
    if (allowOrigin) {
      set("Access-Control-Allow-Origin", allowOrigin);
    }
    if (opts.credentials) {
      set("Access-Control-Allow-Credentials", "true");
    }
    if (exposeHeadersStr) {
      set("Access-Control-Expose-Headers", exposeHeadersStr);
    }
    if (c.req.method === "OPTIONS") {
      if (opts.origin !== "*") {
        c.res.headers.append("Vary", "Origin");
      }
      if (opts.maxAge != null) {
        set("Access-Control-Max-Age", opts.maxAge.toString());
      }
      const allowMethods = await findAllowMethods(c.req.header("origin") || "", c);
      if (allowMethods) {
        set("Access-Control-Allow-Methods", allowMethods);
      }
      let headersStr = allowHeadersStr;
      if (!headersStr) {
        const requestHeaders = c.req.header("Access-Control-Request-Headers");
        if (requestHeaders) {
          headersStr = requestHeaders.split(",").map((h) => h.trim()).join(",");
        }
      }
      if (headersStr) {
        set("Access-Control-Allow-Headers", headersStr);
        c.res.headers.append("Vary", "Access-Control-Request-Headers");
      }
      c.res.headers.delete("Content-Length");
      c.res.headers.delete("Content-Type");
      return new Response(null, {
        headers: c.res.headers,
        status: 204,
        statusText: "No Content"
      });
    }
    await next();
    if (opts.origin !== "*") {
      c.header("Vary", "Origin", { append: true });
    }
  };
};

// ../../node_modules/hono/dist/utils/cookie.js
var validCookieNameRegEx = /^[\w!#$%&'*.^`|~+-]+$/;
var relaxedCookieNameRegEx = /^[!#-:<>-[\]-~]+$/;
var validCookieValueRegEx = /^[ !#-:<-[\]-~]*$/;
var trimCookieWhitespace = (value) => {
  let start = 0;
  let end = value.length;
  while (start < end) {
    const charCode = value.charCodeAt(start);
    if (charCode !== 32 && charCode !== 9) {
      break;
    }
    start++;
  }
  while (end > start) {
    const charCode = value.charCodeAt(end - 1);
    if (charCode !== 32 && charCode !== 9) {
      break;
    }
    end--;
  }
  return start === 0 && end === value.length ? value : value.slice(start, end);
};
var parse = (cookie, name) => {
  if (name && cookie.indexOf(name) === -1) {
    return {};
  }
  const pairs = cookie.split(";");
  const parsedCookie = /* @__PURE__ */ Object.create(null);
  for (const pairStr of pairs) {
    const valueStartPos = pairStr.indexOf("=");
    if (valueStartPos === -1) {
      continue;
    }
    const cookieName = trimCookieWhitespace(pairStr.substring(0, valueStartPos));
    if (name && name !== cookieName || !relaxedCookieNameRegEx.test(cookieName) || cookieName in parsedCookie) {
      continue;
    }
    let cookieValue = trimCookieWhitespace(pairStr.substring(valueStartPos + 1));
    if (cookieValue.startsWith('"') && cookieValue.endsWith('"')) {
      cookieValue = cookieValue.slice(1, -1);
    }
    if (validCookieValueRegEx.test(cookieValue)) {
      parsedCookie[cookieName] = tryDecodeURIComponent(cookieValue);
      if (name) {
        break;
      }
    }
  }
  return parsedCookie;
};
var _serialize = (name, value, opt = {}) => {
  if (!validCookieNameRegEx.test(name)) {
    throw new Error("Invalid cookie name");
  }
  let cookie = `${name}=${value}`;
  if (name.startsWith("__Secure-") && !opt.secure) {
    throw new Error("__Secure- Cookie must have Secure attributes");
  }
  if (name.startsWith("__Host-")) {
    if (!opt.secure) {
      throw new Error("__Host- Cookie must have Secure attributes");
    }
    if (opt.path !== "/") {
      throw new Error('__Host- Cookie must have Path attributes with "/"');
    }
    if (opt.domain) {
      throw new Error("__Host- Cookie must not have Domain attributes");
    }
  }
  for (const key of ["domain", "path", "sameSite", "priority"]) {
    if (opt[key] && /[;\r\n]/.test(opt[key])) {
      throw new Error(`${key} must not contain ";", "\\r", or "\\n"`);
    }
  }
  if (opt && typeof opt.maxAge === "number" && opt.maxAge >= 0) {
    if (opt.maxAge > 3456e4) {
      throw new Error(
        "Cookies Max-Age SHOULD NOT be greater than 400 days (34560000 seconds) in duration."
      );
    }
    cookie += `; Max-Age=${opt.maxAge | 0}`;
  }
  if (opt.domain && opt.prefix !== "host") {
    cookie += `; Domain=${opt.domain}`;
  }
  if (opt.path) {
    cookie += `; Path=${opt.path}`;
  }
  if (opt.expires) {
    if (opt.expires.getTime() - Date.now() > 3456e7) {
      throw new Error(
        "Cookies Expires SHOULD NOT be greater than 400 days (34560000 seconds) in the future."
      );
    }
    cookie += `; Expires=${opt.expires.toUTCString()}`;
  }
  if (opt.httpOnly) {
    cookie += "; HttpOnly";
  }
  if (opt.secure) {
    cookie += "; Secure";
  }
  if (opt.sameSite) {
    cookie += `; SameSite=${opt.sameSite.charAt(0).toUpperCase() + opt.sameSite.slice(1)}`;
  }
  if (opt.priority) {
    cookie += `; Priority=${opt.priority.charAt(0).toUpperCase() + opt.priority.slice(1)}`;
  }
  if (opt.partitioned) {
    if (!opt.secure) {
      throw new Error("Partitioned Cookie must have Secure attributes");
    }
    cookie += "; Partitioned";
  }
  return cookie;
};
var serialize = (name, value, opt) => {
  value = encodeURIComponent(value);
  return _serialize(name, value, opt);
};

// ../../node_modules/hono/dist/helper/cookie/index.js
var getCookie = (c, key, prefix) => {
  const cookie = c.req.raw.headers.get("Cookie");
  if (typeof key === "string") {
    if (!cookie) {
      return void 0;
    }
    let finalKey = key;
    if (prefix === "secure") {
      finalKey = "__Secure-" + key;
    } else if (prefix === "host") {
      finalKey = "__Host-" + key;
    }
    const obj2 = parse(cookie, finalKey);
    return obj2[finalKey];
  }
  if (!cookie) {
    return {};
  }
  const obj = parse(cookie);
  return obj;
};
var generateCookie = (name, value, opt) => {
  let cookie;
  if (opt?.prefix === "secure") {
    cookie = serialize("__Secure-" + name, value, { path: "/", ...opt, secure: true });
  } else if (opt?.prefix === "host") {
    cookie = serialize("__Host-" + name, value, {
      ...opt,
      path: "/",
      secure: true,
      domain: void 0
    });
  } else {
    cookie = serialize(name, value, { path: "/", ...opt });
  }
  return cookie;
};
var setCookie = (c, name, value, opt) => {
  const cookie = generateCookie(name, value, opt);
  c.header("Set-Cookie", cookie, { append: true });
};
var deleteCookie = (c, name, opt) => {
  const deletedCookie = getCookie(c, name, opt?.prefix);
  setCookie(c, name, "", { ...opt, maxAge: 0 });
  return deletedCookie;
};

// ../../node_modules/zod/v3/external.js
var external_exports = {};
__export(external_exports, {
  BRAND: () => BRAND,
  DIRTY: () => DIRTY,
  EMPTY_PATH: () => EMPTY_PATH,
  INVALID: () => INVALID,
  NEVER: () => NEVER,
  OK: () => OK,
  ParseStatus: () => ParseStatus,
  Schema: () => ZodType,
  ZodAny: () => ZodAny,
  ZodArray: () => ZodArray,
  ZodBigInt: () => ZodBigInt,
  ZodBoolean: () => ZodBoolean,
  ZodBranded: () => ZodBranded,
  ZodCatch: () => ZodCatch,
  ZodDate: () => ZodDate,
  ZodDefault: () => ZodDefault,
  ZodDiscriminatedUnion: () => ZodDiscriminatedUnion,
  ZodEffects: () => ZodEffects,
  ZodEnum: () => ZodEnum,
  ZodError: () => ZodError,
  ZodFirstPartyTypeKind: () => ZodFirstPartyTypeKind,
  ZodFunction: () => ZodFunction,
  ZodIntersection: () => ZodIntersection,
  ZodIssueCode: () => ZodIssueCode,
  ZodLazy: () => ZodLazy,
  ZodLiteral: () => ZodLiteral,
  ZodMap: () => ZodMap,
  ZodNaN: () => ZodNaN,
  ZodNativeEnum: () => ZodNativeEnum,
  ZodNever: () => ZodNever,
  ZodNull: () => ZodNull,
  ZodNullable: () => ZodNullable,
  ZodNumber: () => ZodNumber,
  ZodObject: () => ZodObject,
  ZodOptional: () => ZodOptional,
  ZodParsedType: () => ZodParsedType,
  ZodPipeline: () => ZodPipeline,
  ZodPromise: () => ZodPromise,
  ZodReadonly: () => ZodReadonly,
  ZodRecord: () => ZodRecord,
  ZodSchema: () => ZodType,
  ZodSet: () => ZodSet,
  ZodString: () => ZodString,
  ZodSymbol: () => ZodSymbol,
  ZodTransformer: () => ZodEffects,
  ZodTuple: () => ZodTuple,
  ZodType: () => ZodType,
  ZodUndefined: () => ZodUndefined,
  ZodUnion: () => ZodUnion,
  ZodUnknown: () => ZodUnknown,
  ZodVoid: () => ZodVoid,
  addIssueToContext: () => addIssueToContext,
  any: () => anyType,
  array: () => arrayType,
  bigint: () => bigIntType,
  boolean: () => booleanType,
  coerce: () => coerce,
  custom: () => custom,
  date: () => dateType,
  datetimeRegex: () => datetimeRegex,
  defaultErrorMap: () => en_default,
  discriminatedUnion: () => discriminatedUnionType,
  effect: () => effectsType,
  enum: () => enumType,
  function: () => functionType,
  getErrorMap: () => getErrorMap,
  getParsedType: () => getParsedType,
  instanceof: () => instanceOfType,
  intersection: () => intersectionType,
  isAborted: () => isAborted,
  isAsync: () => isAsync,
  isDirty: () => isDirty,
  isValid: () => isValid,
  late: () => late,
  lazy: () => lazyType,
  literal: () => literalType,
  makeIssue: () => makeIssue,
  map: () => mapType,
  nan: () => nanType,
  nativeEnum: () => nativeEnumType,
  never: () => neverType,
  null: () => nullType,
  nullable: () => nullableType,
  number: () => numberType,
  object: () => objectType,
  objectUtil: () => objectUtil,
  oboolean: () => oboolean,
  onumber: () => onumber,
  optional: () => optionalType,
  ostring: () => ostring,
  pipeline: () => pipelineType,
  preprocess: () => preprocessType,
  promise: () => promiseType,
  quotelessJson: () => quotelessJson,
  record: () => recordType,
  set: () => setType,
  setErrorMap: () => setErrorMap,
  strictObject: () => strictObjectType,
  string: () => stringType,
  symbol: () => symbolType,
  transformer: () => effectsType,
  tuple: () => tupleType,
  undefined: () => undefinedType,
  union: () => unionType,
  unknown: () => unknownType,
  util: () => util,
  void: () => voidType
});

// ../../node_modules/zod/v3/helpers/util.js
var util;
(function(util2) {
  util2.assertEqual = (_) => {
  };
  function assertIs(_arg) {
  }
  util2.assertIs = assertIs;
  function assertNever(_x) {
    throw new Error();
  }
  util2.assertNever = assertNever;
  util2.arrayToEnum = (items) => {
    const obj = {};
    for (const item of items) {
      obj[item] = item;
    }
    return obj;
  };
  util2.getValidEnumValues = (obj) => {
    const validKeys = util2.objectKeys(obj).filter((k) => typeof obj[obj[k]] !== "number");
    const filtered = {};
    for (const k of validKeys) {
      filtered[k] = obj[k];
    }
    return util2.objectValues(filtered);
  };
  util2.objectValues = (obj) => {
    return util2.objectKeys(obj).map(function(e) {
      return obj[e];
    });
  };
  util2.objectKeys = typeof Object.keys === "function" ? (obj) => Object.keys(obj) : (object) => {
    const keys = [];
    for (const key in object) {
      if (Object.prototype.hasOwnProperty.call(object, key)) {
        keys.push(key);
      }
    }
    return keys;
  };
  util2.find = (arr, checker) => {
    for (const item of arr) {
      if (checker(item))
        return item;
    }
    return void 0;
  };
  util2.isInteger = typeof Number.isInteger === "function" ? (val) => Number.isInteger(val) : (val) => typeof val === "number" && Number.isFinite(val) && Math.floor(val) === val;
  function joinValues(array, separator = " | ") {
    return array.map((val) => typeof val === "string" ? `'${val}'` : val).join(separator);
  }
  util2.joinValues = joinValues;
  util2.jsonStringifyReplacer = (_, value) => {
    if (typeof value === "bigint") {
      return value.toString();
    }
    return value;
  };
})(util || (util = {}));
var objectUtil;
(function(objectUtil2) {
  objectUtil2.mergeShapes = (first, second) => {
    return {
      ...first,
      ...second
      // second overwrites first
    };
  };
})(objectUtil || (objectUtil = {}));
var ZodParsedType = util.arrayToEnum([
  "string",
  "nan",
  "number",
  "integer",
  "float",
  "boolean",
  "date",
  "bigint",
  "symbol",
  "function",
  "undefined",
  "null",
  "array",
  "object",
  "unknown",
  "promise",
  "void",
  "never",
  "map",
  "set"
]);
var getParsedType = (data) => {
  const t = typeof data;
  switch (t) {
    case "undefined":
      return ZodParsedType.undefined;
    case "string":
      return ZodParsedType.string;
    case "number":
      return Number.isNaN(data) ? ZodParsedType.nan : ZodParsedType.number;
    case "boolean":
      return ZodParsedType.boolean;
    case "function":
      return ZodParsedType.function;
    case "bigint":
      return ZodParsedType.bigint;
    case "symbol":
      return ZodParsedType.symbol;
    case "object":
      if (Array.isArray(data)) {
        return ZodParsedType.array;
      }
      if (data === null) {
        return ZodParsedType.null;
      }
      if (data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function") {
        return ZodParsedType.promise;
      }
      if (typeof Map !== "undefined" && data instanceof Map) {
        return ZodParsedType.map;
      }
      if (typeof Set !== "undefined" && data instanceof Set) {
        return ZodParsedType.set;
      }
      if (typeof Date !== "undefined" && data instanceof Date) {
        return ZodParsedType.date;
      }
      return ZodParsedType.object;
    default:
      return ZodParsedType.unknown;
  }
};

// ../../node_modules/zod/v3/ZodError.js
var ZodIssueCode = util.arrayToEnum([
  "invalid_type",
  "invalid_literal",
  "custom",
  "invalid_union",
  "invalid_union_discriminator",
  "invalid_enum_value",
  "unrecognized_keys",
  "invalid_arguments",
  "invalid_return_type",
  "invalid_date",
  "invalid_string",
  "too_small",
  "too_big",
  "invalid_intersection_types",
  "not_multiple_of",
  "not_finite"
]);
var quotelessJson = (obj) => {
  const json = JSON.stringify(obj, null, 2);
  return json.replace(/"([^"]+)":/g, "$1:");
};
var ZodError = class _ZodError extends Error {
  get errors() {
    return this.issues;
  }
  constructor(issues) {
    super();
    this.issues = [];
    this.addIssue = (sub) => {
      this.issues = [...this.issues, sub];
    };
    this.addIssues = (subs = []) => {
      this.issues = [...this.issues, ...subs];
    };
    const actualProto = new.target.prototype;
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(this, actualProto);
    } else {
      this.__proto__ = actualProto;
    }
    this.name = "ZodError";
    this.issues = issues;
  }
  format(_mapper) {
    const mapper = _mapper || function(issue) {
      return issue.message;
    };
    const fieldErrors = { _errors: [] };
    const processError = (error) => {
      for (const issue of error.issues) {
        if (issue.code === "invalid_union") {
          issue.unionErrors.map(processError);
        } else if (issue.code === "invalid_return_type") {
          processError(issue.returnTypeError);
        } else if (issue.code === "invalid_arguments") {
          processError(issue.argumentsError);
        } else if (issue.path.length === 0) {
          fieldErrors._errors.push(mapper(issue));
        } else {
          let curr = fieldErrors;
          let i = 0;
          while (i < issue.path.length) {
            const el = issue.path[i];
            const terminal = i === issue.path.length - 1;
            if (!terminal) {
              curr[el] = curr[el] || { _errors: [] };
            } else {
              curr[el] = curr[el] || { _errors: [] };
              curr[el]._errors.push(mapper(issue));
            }
            curr = curr[el];
            i++;
          }
        }
      }
    };
    processError(this);
    return fieldErrors;
  }
  static assert(value) {
    if (!(value instanceof _ZodError)) {
      throw new Error(`Not a ZodError: ${value}`);
    }
  }
  toString() {
    return this.message;
  }
  get message() {
    return JSON.stringify(this.issues, util.jsonStringifyReplacer, 2);
  }
  get isEmpty() {
    return this.issues.length === 0;
  }
  flatten(mapper = (issue) => issue.message) {
    const fieldErrors = {};
    const formErrors = [];
    for (const sub of this.issues) {
      if (sub.path.length > 0) {
        const firstEl = sub.path[0];
        fieldErrors[firstEl] = fieldErrors[firstEl] || [];
        fieldErrors[firstEl].push(mapper(sub));
      } else {
        formErrors.push(mapper(sub));
      }
    }
    return { formErrors, fieldErrors };
  }
  get formErrors() {
    return this.flatten();
  }
};
ZodError.create = (issues) => {
  const error = new ZodError(issues);
  return error;
};

// ../../node_modules/zod/v3/locales/en.js
var errorMap = (issue, _ctx) => {
  let message;
  switch (issue.code) {
    case ZodIssueCode.invalid_type:
      if (issue.received === ZodParsedType.undefined) {
        message = "Required";
      } else {
        message = `Expected ${issue.expected}, received ${issue.received}`;
      }
      break;
    case ZodIssueCode.invalid_literal:
      message = `Invalid literal value, expected ${JSON.stringify(issue.expected, util.jsonStringifyReplacer)}`;
      break;
    case ZodIssueCode.unrecognized_keys:
      message = `Unrecognized key(s) in object: ${util.joinValues(issue.keys, ", ")}`;
      break;
    case ZodIssueCode.invalid_union:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_union_discriminator:
      message = `Invalid discriminator value. Expected ${util.joinValues(issue.options)}`;
      break;
    case ZodIssueCode.invalid_enum_value:
      message = `Invalid enum value. Expected ${util.joinValues(issue.options)}, received '${issue.received}'`;
      break;
    case ZodIssueCode.invalid_arguments:
      message = `Invalid function arguments`;
      break;
    case ZodIssueCode.invalid_return_type:
      message = `Invalid function return type`;
      break;
    case ZodIssueCode.invalid_date:
      message = `Invalid date`;
      break;
    case ZodIssueCode.invalid_string:
      if (typeof issue.validation === "object") {
        if ("includes" in issue.validation) {
          message = `Invalid input: must include "${issue.validation.includes}"`;
          if (typeof issue.validation.position === "number") {
            message = `${message} at one or more positions greater than or equal to ${issue.validation.position}`;
          }
        } else if ("startsWith" in issue.validation) {
          message = `Invalid input: must start with "${issue.validation.startsWith}"`;
        } else if ("endsWith" in issue.validation) {
          message = `Invalid input: must end with "${issue.validation.endsWith}"`;
        } else {
          util.assertNever(issue.validation);
        }
      } else if (issue.validation !== "regex") {
        message = `Invalid ${issue.validation}`;
      } else {
        message = "Invalid";
      }
      break;
    case ZodIssueCode.too_small:
      if (issue.type === "array")
        message = `Array must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `more than`} ${issue.minimum} element(s)`;
      else if (issue.type === "string")
        message = `String must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `over`} ${issue.minimum} character(s)`;
      else if (issue.type === "number")
        message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
      else if (issue.type === "bigint")
        message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
      else if (issue.type === "date")
        message = `Date must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${new Date(Number(issue.minimum))}`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode.too_big:
      if (issue.type === "array")
        message = `Array must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `less than`} ${issue.maximum} element(s)`;
      else if (issue.type === "string")
        message = `String must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `under`} ${issue.maximum} character(s)`;
      else if (issue.type === "number")
        message = `Number must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
      else if (issue.type === "bigint")
        message = `BigInt must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
      else if (issue.type === "date")
        message = `Date must be ${issue.exact ? `exactly` : issue.inclusive ? `smaller than or equal to` : `smaller than`} ${new Date(Number(issue.maximum))}`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode.custom:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_intersection_types:
      message = `Intersection results could not be merged`;
      break;
    case ZodIssueCode.not_multiple_of:
      message = `Number must be a multiple of ${issue.multipleOf}`;
      break;
    case ZodIssueCode.not_finite:
      message = "Number must be finite";
      break;
    default:
      message = _ctx.defaultError;
      util.assertNever(issue);
  }
  return { message };
};
var en_default = errorMap;

// ../../node_modules/zod/v3/errors.js
var overrideErrorMap = en_default;
function setErrorMap(map) {
  overrideErrorMap = map;
}
function getErrorMap() {
  return overrideErrorMap;
}

// ../../node_modules/zod/v3/helpers/parseUtil.js
var makeIssue = (params) => {
  const { data, path, errorMaps, issueData } = params;
  const fullPath = [...path, ...issueData.path || []];
  const fullIssue = {
    ...issueData,
    path: fullPath
  };
  if (issueData.message !== void 0) {
    return {
      ...issueData,
      path: fullPath,
      message: issueData.message
    };
  }
  let errorMessage = "";
  const maps = errorMaps.filter((m) => !!m).slice().reverse();
  for (const map of maps) {
    errorMessage = map(fullIssue, { data, defaultError: errorMessage }).message;
  }
  return {
    ...issueData,
    path: fullPath,
    message: errorMessage
  };
};
var EMPTY_PATH = [];
function addIssueToContext(ctx, issueData) {
  const overrideMap = getErrorMap();
  const issue = makeIssue({
    issueData,
    data: ctx.data,
    path: ctx.path,
    errorMaps: [
      ctx.common.contextualErrorMap,
      // contextual error map is first priority
      ctx.schemaErrorMap,
      // then schema-bound map if available
      overrideMap,
      // then global override map
      overrideMap === en_default ? void 0 : en_default
      // then global default map
    ].filter((x) => !!x)
  });
  ctx.common.issues.push(issue);
}
var ParseStatus = class _ParseStatus {
  constructor() {
    this.value = "valid";
  }
  dirty() {
    if (this.value === "valid")
      this.value = "dirty";
  }
  abort() {
    if (this.value !== "aborted")
      this.value = "aborted";
  }
  static mergeArray(status, results) {
    const arrayValue = [];
    for (const s of results) {
      if (s.status === "aborted")
        return INVALID;
      if (s.status === "dirty")
        status.dirty();
      arrayValue.push(s.value);
    }
    return { status: status.value, value: arrayValue };
  }
  static async mergeObjectAsync(status, pairs) {
    const syncPairs = [];
    for (const pair of pairs) {
      const key = await pair.key;
      const value = await pair.value;
      syncPairs.push({
        key,
        value
      });
    }
    return _ParseStatus.mergeObjectSync(status, syncPairs);
  }
  static mergeObjectSync(status, pairs) {
    const finalObject = {};
    for (const pair of pairs) {
      const { key, value } = pair;
      if (key.status === "aborted")
        return INVALID;
      if (value.status === "aborted")
        return INVALID;
      if (key.status === "dirty")
        status.dirty();
      if (value.status === "dirty")
        status.dirty();
      if (key.value !== "__proto__" && (typeof value.value !== "undefined" || pair.alwaysSet)) {
        finalObject[key.value] = value.value;
      }
    }
    return { status: status.value, value: finalObject };
  }
};
var INVALID = Object.freeze({
  status: "aborted"
});
var DIRTY = (value) => ({ status: "dirty", value });
var OK = (value) => ({ status: "valid", value });
var isAborted = (x) => x.status === "aborted";
var isDirty = (x) => x.status === "dirty";
var isValid = (x) => x.status === "valid";
var isAsync = (x) => typeof Promise !== "undefined" && x instanceof Promise;

// ../../node_modules/zod/v3/helpers/errorUtil.js
var errorUtil;
(function(errorUtil2) {
  errorUtil2.errToObj = (message) => typeof message === "string" ? { message } : message || {};
  errorUtil2.toString = (message) => typeof message === "string" ? message : message?.message;
})(errorUtil || (errorUtil = {}));

// ../../node_modules/zod/v3/types.js
var ParseInputLazyPath = class {
  constructor(parent, value, path, key) {
    this._cachedPath = [];
    this.parent = parent;
    this.data = value;
    this._path = path;
    this._key = key;
  }
  get path() {
    if (!this._cachedPath.length) {
      if (Array.isArray(this._key)) {
        this._cachedPath.push(...this._path, ...this._key);
      } else {
        this._cachedPath.push(...this._path, this._key);
      }
    }
    return this._cachedPath;
  }
};
var handleResult = (ctx, result) => {
  if (isValid(result)) {
    return { success: true, data: result.value };
  } else {
    if (!ctx.common.issues.length) {
      throw new Error("Validation failed but no issues detected.");
    }
    return {
      success: false,
      get error() {
        if (this._error)
          return this._error;
        const error = new ZodError(ctx.common.issues);
        this._error = error;
        return this._error;
      }
    };
  }
};
function processCreateParams(params) {
  if (!params)
    return {};
  const { errorMap: errorMap2, invalid_type_error, required_error, description } = params;
  if (errorMap2 && (invalid_type_error || required_error)) {
    throw new Error(`Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`);
  }
  if (errorMap2)
    return { errorMap: errorMap2, description };
  const customMap = (iss, ctx) => {
    const { message } = params;
    if (iss.code === "invalid_enum_value") {
      return { message: message ?? ctx.defaultError };
    }
    if (typeof ctx.data === "undefined") {
      return { message: message ?? required_error ?? ctx.defaultError };
    }
    if (iss.code !== "invalid_type")
      return { message: ctx.defaultError };
    return { message: message ?? invalid_type_error ?? ctx.defaultError };
  };
  return { errorMap: customMap, description };
}
var ZodType = class {
  get description() {
    return this._def.description;
  }
  _getType(input) {
    return getParsedType(input.data);
  }
  _getOrReturnCtx(input, ctx) {
    return ctx || {
      common: input.parent.common,
      data: input.data,
      parsedType: getParsedType(input.data),
      schemaErrorMap: this._def.errorMap,
      path: input.path,
      parent: input.parent
    };
  }
  _processInputParams(input) {
    return {
      status: new ParseStatus(),
      ctx: {
        common: input.parent.common,
        data: input.data,
        parsedType: getParsedType(input.data),
        schemaErrorMap: this._def.errorMap,
        path: input.path,
        parent: input.parent
      }
    };
  }
  _parseSync(input) {
    const result = this._parse(input);
    if (isAsync(result)) {
      throw new Error("Synchronous parse encountered promise.");
    }
    return result;
  }
  _parseAsync(input) {
    const result = this._parse(input);
    return Promise.resolve(result);
  }
  parse(data, params) {
    const result = this.safeParse(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  safeParse(data, params) {
    const ctx = {
      common: {
        issues: [],
        async: params?.async ?? false,
        contextualErrorMap: params?.errorMap
      },
      path: params?.path || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    const result = this._parseSync({ data, path: ctx.path, parent: ctx });
    return handleResult(ctx, result);
  }
  "~validate"(data) {
    const ctx = {
      common: {
        issues: [],
        async: !!this["~standard"].async
      },
      path: [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    if (!this["~standard"].async) {
      try {
        const result = this._parseSync({ data, path: [], parent: ctx });
        return isValid(result) ? {
          value: result.value
        } : {
          issues: ctx.common.issues
        };
      } catch (err) {
        if (err?.message?.toLowerCase()?.includes("encountered")) {
          this["~standard"].async = true;
        }
        ctx.common = {
          issues: [],
          async: true
        };
      }
    }
    return this._parseAsync({ data, path: [], parent: ctx }).then((result) => isValid(result) ? {
      value: result.value
    } : {
      issues: ctx.common.issues
    });
  }
  async parseAsync(data, params) {
    const result = await this.safeParseAsync(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  async safeParseAsync(data, params) {
    const ctx = {
      common: {
        issues: [],
        contextualErrorMap: params?.errorMap,
        async: true
      },
      path: params?.path || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    const maybeAsyncResult = this._parse({ data, path: ctx.path, parent: ctx });
    const result = await (isAsync(maybeAsyncResult) ? maybeAsyncResult : Promise.resolve(maybeAsyncResult));
    return handleResult(ctx, result);
  }
  refine(check, message) {
    const getIssueProperties = (val) => {
      if (typeof message === "string" || typeof message === "undefined") {
        return { message };
      } else if (typeof message === "function") {
        return message(val);
      } else {
        return message;
      }
    };
    return this._refinement((val, ctx) => {
      const result = check(val);
      const setError = () => ctx.addIssue({
        code: ZodIssueCode.custom,
        ...getIssueProperties(val)
      });
      if (typeof Promise !== "undefined" && result instanceof Promise) {
        return result.then((data) => {
          if (!data) {
            setError();
            return false;
          } else {
            return true;
          }
        });
      }
      if (!result) {
        setError();
        return false;
      } else {
        return true;
      }
    });
  }
  refinement(check, refinementData) {
    return this._refinement((val, ctx) => {
      if (!check(val)) {
        ctx.addIssue(typeof refinementData === "function" ? refinementData(val, ctx) : refinementData);
        return false;
      } else {
        return true;
      }
    });
  }
  _refinement(refinement) {
    return new ZodEffects({
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "refinement", refinement }
    });
  }
  superRefine(refinement) {
    return this._refinement(refinement);
  }
  constructor(def) {
    this.spa = this.safeParseAsync;
    this._def = def;
    this.parse = this.parse.bind(this);
    this.safeParse = this.safeParse.bind(this);
    this.parseAsync = this.parseAsync.bind(this);
    this.safeParseAsync = this.safeParseAsync.bind(this);
    this.spa = this.spa.bind(this);
    this.refine = this.refine.bind(this);
    this.refinement = this.refinement.bind(this);
    this.superRefine = this.superRefine.bind(this);
    this.optional = this.optional.bind(this);
    this.nullable = this.nullable.bind(this);
    this.nullish = this.nullish.bind(this);
    this.array = this.array.bind(this);
    this.promise = this.promise.bind(this);
    this.or = this.or.bind(this);
    this.and = this.and.bind(this);
    this.transform = this.transform.bind(this);
    this.brand = this.brand.bind(this);
    this.default = this.default.bind(this);
    this.catch = this.catch.bind(this);
    this.describe = this.describe.bind(this);
    this.pipe = this.pipe.bind(this);
    this.readonly = this.readonly.bind(this);
    this.isNullable = this.isNullable.bind(this);
    this.isOptional = this.isOptional.bind(this);
    this["~standard"] = {
      version: 1,
      vendor: "zod",
      validate: (data) => this["~validate"](data)
    };
  }
  optional() {
    return ZodOptional.create(this, this._def);
  }
  nullable() {
    return ZodNullable.create(this, this._def);
  }
  nullish() {
    return this.nullable().optional();
  }
  array() {
    return ZodArray.create(this);
  }
  promise() {
    return ZodPromise.create(this, this._def);
  }
  or(option) {
    return ZodUnion.create([this, option], this._def);
  }
  and(incoming) {
    return ZodIntersection.create(this, incoming, this._def);
  }
  transform(transform) {
    return new ZodEffects({
      ...processCreateParams(this._def),
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "transform", transform }
    });
  }
  default(def) {
    const defaultValueFunc = typeof def === "function" ? def : () => def;
    return new ZodDefault({
      ...processCreateParams(this._def),
      innerType: this,
      defaultValue: defaultValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodDefault
    });
  }
  brand() {
    return new ZodBranded({
      typeName: ZodFirstPartyTypeKind.ZodBranded,
      type: this,
      ...processCreateParams(this._def)
    });
  }
  catch(def) {
    const catchValueFunc = typeof def === "function" ? def : () => def;
    return new ZodCatch({
      ...processCreateParams(this._def),
      innerType: this,
      catchValue: catchValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodCatch
    });
  }
  describe(description) {
    const This = this.constructor;
    return new This({
      ...this._def,
      description
    });
  }
  pipe(target) {
    return ZodPipeline.create(this, target);
  }
  readonly() {
    return ZodReadonly.create(this);
  }
  isOptional() {
    return this.safeParse(void 0).success;
  }
  isNullable() {
    return this.safeParse(null).success;
  }
};
var cuidRegex = /^c[^\s-]{8,}$/i;
var cuid2Regex = /^[0-9a-z]+$/;
var ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/i;
var uuidRegex = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i;
var nanoidRegex = /^[a-z0-9_-]{21}$/i;
var jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
var durationRegex = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/;
var emailRegex = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i;
var _emojiRegex = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
var emojiRegex;
var ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
var ipv4CidrRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/;
var ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
var ipv6CidrRegex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
var base64Regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
var base64urlRegex = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/;
var dateRegexSource = `((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))`;
var dateRegex = new RegExp(`^${dateRegexSource}$`);
function timeRegexSource(args) {
  let secondsRegexSource = `[0-5]\\d`;
  if (args.precision) {
    secondsRegexSource = `${secondsRegexSource}\\.\\d{${args.precision}}`;
  } else if (args.precision == null) {
    secondsRegexSource = `${secondsRegexSource}(\\.\\d+)?`;
  }
  const secondsQuantifier = args.precision ? "+" : "?";
  return `([01]\\d|2[0-3]):[0-5]\\d(:${secondsRegexSource})${secondsQuantifier}`;
}
function timeRegex(args) {
  return new RegExp(`^${timeRegexSource(args)}$`);
}
function datetimeRegex(args) {
  let regex = `${dateRegexSource}T${timeRegexSource(args)}`;
  const opts = [];
  opts.push(args.local ? `Z?` : `Z`);
  if (args.offset)
    opts.push(`([+-]\\d{2}:?\\d{2})`);
  regex = `${regex}(${opts.join("|")})`;
  return new RegExp(`^${regex}$`);
}
function isValidIP(ip, version) {
  if ((version === "v4" || !version) && ipv4Regex.test(ip)) {
    return true;
  }
  if ((version === "v6" || !version) && ipv6Regex.test(ip)) {
    return true;
  }
  return false;
}
function isValidJWT(jwt, alg) {
  if (!jwtRegex.test(jwt))
    return false;
  try {
    const [header] = jwt.split(".");
    if (!header)
      return false;
    const base64 = header.replace(/-/g, "+").replace(/_/g, "/").padEnd(header.length + (4 - header.length % 4) % 4, "=");
    const decoded = JSON.parse(atob(base64));
    if (typeof decoded !== "object" || decoded === null)
      return false;
    if ("typ" in decoded && decoded?.typ !== "JWT")
      return false;
    if (!decoded.alg)
      return false;
    if (alg && decoded.alg !== alg)
      return false;
    return true;
  } catch {
    return false;
  }
}
function isValidCidr(ip, version) {
  if ((version === "v4" || !version) && ipv4CidrRegex.test(ip)) {
    return true;
  }
  if ((version === "v6" || !version) && ipv6CidrRegex.test(ip)) {
    return true;
  }
  return false;
}
var ZodString = class _ZodString extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = String(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.string) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.string,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    const status = new ParseStatus();
    let ctx = void 0;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        if (input.data.length < check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: "string",
            inclusive: true,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        if (input.data.length > check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: "string",
            inclusive: true,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "length") {
        const tooBig = input.data.length > check.value;
        const tooSmall = input.data.length < check.value;
        if (tooBig || tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          if (tooBig) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_big,
              maximum: check.value,
              type: "string",
              inclusive: true,
              exact: true,
              message: check.message
            });
          } else if (tooSmall) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_small,
              minimum: check.value,
              type: "string",
              inclusive: true,
              exact: true,
              message: check.message
            });
          }
          status.dirty();
        }
      } else if (check.kind === "email") {
        if (!emailRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "email",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "emoji") {
        if (!emojiRegex) {
          emojiRegex = new RegExp(_emojiRegex, "u");
        }
        if (!emojiRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "emoji",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "uuid") {
        if (!uuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "uuid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "nanoid") {
        if (!nanoidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "nanoid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cuid") {
        if (!cuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cuid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cuid2") {
        if (!cuid2Regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cuid2",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "ulid") {
        if (!ulidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "ulid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "url") {
        try {
          new URL(input.data);
        } catch {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "url",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "regex") {
        check.regex.lastIndex = 0;
        const testResult = check.regex.test(input.data);
        if (!testResult) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "regex",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "trim") {
        input.data = input.data.trim();
      } else if (check.kind === "includes") {
        if (!input.data.includes(check.value, check.position)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { includes: check.value, position: check.position },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "toLowerCase") {
        input.data = input.data.toLowerCase();
      } else if (check.kind === "toUpperCase") {
        input.data = input.data.toUpperCase();
      } else if (check.kind === "startsWith") {
        if (!input.data.startsWith(check.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { startsWith: check.value },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "endsWith") {
        if (!input.data.endsWith(check.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { endsWith: check.value },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "datetime") {
        const regex = datetimeRegex(check);
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "datetime",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "date") {
        const regex = dateRegex;
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "date",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "time") {
        const regex = timeRegex(check);
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "time",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "duration") {
        if (!durationRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "duration",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "ip") {
        if (!isValidIP(input.data, check.version)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "ip",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "jwt") {
        if (!isValidJWT(input.data, check.alg)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "jwt",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cidr") {
        if (!isValidCidr(input.data, check.version)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cidr",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "base64") {
        if (!base64Regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "base64",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "base64url") {
        if (!base64urlRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "base64url",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  _regex(regex, validation, message) {
    return this.refinement((data) => regex.test(data), {
      validation,
      code: ZodIssueCode.invalid_string,
      ...errorUtil.errToObj(message)
    });
  }
  _addCheck(check) {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  email(message) {
    return this._addCheck({ kind: "email", ...errorUtil.errToObj(message) });
  }
  url(message) {
    return this._addCheck({ kind: "url", ...errorUtil.errToObj(message) });
  }
  emoji(message) {
    return this._addCheck({ kind: "emoji", ...errorUtil.errToObj(message) });
  }
  uuid(message) {
    return this._addCheck({ kind: "uuid", ...errorUtil.errToObj(message) });
  }
  nanoid(message) {
    return this._addCheck({ kind: "nanoid", ...errorUtil.errToObj(message) });
  }
  cuid(message) {
    return this._addCheck({ kind: "cuid", ...errorUtil.errToObj(message) });
  }
  cuid2(message) {
    return this._addCheck({ kind: "cuid2", ...errorUtil.errToObj(message) });
  }
  ulid(message) {
    return this._addCheck({ kind: "ulid", ...errorUtil.errToObj(message) });
  }
  base64(message) {
    return this._addCheck({ kind: "base64", ...errorUtil.errToObj(message) });
  }
  base64url(message) {
    return this._addCheck({
      kind: "base64url",
      ...errorUtil.errToObj(message)
    });
  }
  jwt(options) {
    return this._addCheck({ kind: "jwt", ...errorUtil.errToObj(options) });
  }
  ip(options) {
    return this._addCheck({ kind: "ip", ...errorUtil.errToObj(options) });
  }
  cidr(options) {
    return this._addCheck({ kind: "cidr", ...errorUtil.errToObj(options) });
  }
  datetime(options) {
    if (typeof options === "string") {
      return this._addCheck({
        kind: "datetime",
        precision: null,
        offset: false,
        local: false,
        message: options
      });
    }
    return this._addCheck({
      kind: "datetime",
      precision: typeof options?.precision === "undefined" ? null : options?.precision,
      offset: options?.offset ?? false,
      local: options?.local ?? false,
      ...errorUtil.errToObj(options?.message)
    });
  }
  date(message) {
    return this._addCheck({ kind: "date", message });
  }
  time(options) {
    if (typeof options === "string") {
      return this._addCheck({
        kind: "time",
        precision: null,
        message: options
      });
    }
    return this._addCheck({
      kind: "time",
      precision: typeof options?.precision === "undefined" ? null : options?.precision,
      ...errorUtil.errToObj(options?.message)
    });
  }
  duration(message) {
    return this._addCheck({ kind: "duration", ...errorUtil.errToObj(message) });
  }
  regex(regex, message) {
    return this._addCheck({
      kind: "regex",
      regex,
      ...errorUtil.errToObj(message)
    });
  }
  includes(value, options) {
    return this._addCheck({
      kind: "includes",
      value,
      position: options?.position,
      ...errorUtil.errToObj(options?.message)
    });
  }
  startsWith(value, message) {
    return this._addCheck({
      kind: "startsWith",
      value,
      ...errorUtil.errToObj(message)
    });
  }
  endsWith(value, message) {
    return this._addCheck({
      kind: "endsWith",
      value,
      ...errorUtil.errToObj(message)
    });
  }
  min(minLength, message) {
    return this._addCheck({
      kind: "min",
      value: minLength,
      ...errorUtil.errToObj(message)
    });
  }
  max(maxLength, message) {
    return this._addCheck({
      kind: "max",
      value: maxLength,
      ...errorUtil.errToObj(message)
    });
  }
  length(len, message) {
    return this._addCheck({
      kind: "length",
      value: len,
      ...errorUtil.errToObj(message)
    });
  }
  /**
   * Equivalent to `.min(1)`
   */
  nonempty(message) {
    return this.min(1, errorUtil.errToObj(message));
  }
  trim() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "trim" }]
    });
  }
  toLowerCase() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "toLowerCase" }]
    });
  }
  toUpperCase() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "toUpperCase" }]
    });
  }
  get isDatetime() {
    return !!this._def.checks.find((ch) => ch.kind === "datetime");
  }
  get isDate() {
    return !!this._def.checks.find((ch) => ch.kind === "date");
  }
  get isTime() {
    return !!this._def.checks.find((ch) => ch.kind === "time");
  }
  get isDuration() {
    return !!this._def.checks.find((ch) => ch.kind === "duration");
  }
  get isEmail() {
    return !!this._def.checks.find((ch) => ch.kind === "email");
  }
  get isURL() {
    return !!this._def.checks.find((ch) => ch.kind === "url");
  }
  get isEmoji() {
    return !!this._def.checks.find((ch) => ch.kind === "emoji");
  }
  get isUUID() {
    return !!this._def.checks.find((ch) => ch.kind === "uuid");
  }
  get isNANOID() {
    return !!this._def.checks.find((ch) => ch.kind === "nanoid");
  }
  get isCUID() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid");
  }
  get isCUID2() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid2");
  }
  get isULID() {
    return !!this._def.checks.find((ch) => ch.kind === "ulid");
  }
  get isIP() {
    return !!this._def.checks.find((ch) => ch.kind === "ip");
  }
  get isCIDR() {
    return !!this._def.checks.find((ch) => ch.kind === "cidr");
  }
  get isBase64() {
    return !!this._def.checks.find((ch) => ch.kind === "base64");
  }
  get isBase64url() {
    return !!this._def.checks.find((ch) => ch.kind === "base64url");
  }
  get minLength() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxLength() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
};
ZodString.create = (params) => {
  return new ZodString({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodString,
    coerce: params?.coerce ?? false,
    ...processCreateParams(params)
  });
};
function floatSafeRemainder(val, step) {
  const valDecCount = (val.toString().split(".")[1] || "").length;
  const stepDecCount = (step.toString().split(".")[1] || "").length;
  const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
  const valInt = Number.parseInt(val.toFixed(decCount).replace(".", ""));
  const stepInt = Number.parseInt(step.toFixed(decCount).replace(".", ""));
  return valInt % stepInt / 10 ** decCount;
}
var ZodNumber = class _ZodNumber extends ZodType {
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
    this.step = this.multipleOf;
  }
  _parse(input) {
    if (this._def.coerce) {
      input.data = Number(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.number) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.number,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    let ctx = void 0;
    const status = new ParseStatus();
    for (const check of this._def.checks) {
      if (check.kind === "int") {
        if (!util.isInteger(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: "integer",
            received: "float",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "min") {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: "number",
            inclusive: check.inclusive,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: "number",
            inclusive: check.inclusive,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "multipleOf") {
        if (floatSafeRemainder(input.data, check.value) !== 0) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_multiple_of,
            multipleOf: check.value,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "finite") {
        if (!Number.isFinite(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_finite,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  gte(value, message) {
    return this.setLimit("min", value, true, errorUtil.toString(message));
  }
  gt(value, message) {
    return this.setLimit("min", value, false, errorUtil.toString(message));
  }
  lte(value, message) {
    return this.setLimit("max", value, true, errorUtil.toString(message));
  }
  lt(value, message) {
    return this.setLimit("max", value, false, errorUtil.toString(message));
  }
  setLimit(kind, value, inclusive, message) {
    return new _ZodNumber({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check) {
    return new _ZodNumber({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  int(message) {
    return this._addCheck({
      kind: "int",
      message: errorUtil.toString(message)
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: "multipleOf",
      value,
      message: errorUtil.toString(message)
    });
  }
  finite(message) {
    return this._addCheck({
      kind: "finite",
      message: errorUtil.toString(message)
    });
  }
  safe(message) {
    return this._addCheck({
      kind: "min",
      inclusive: true,
      value: Number.MIN_SAFE_INTEGER,
      message: errorUtil.toString(message)
    })._addCheck({
      kind: "max",
      inclusive: true,
      value: Number.MAX_SAFE_INTEGER,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxValue() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
  get isInt() {
    return !!this._def.checks.find((ch) => ch.kind === "int" || ch.kind === "multipleOf" && util.isInteger(ch.value));
  }
  get isFinite() {
    let max = null;
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "finite" || ch.kind === "int" || ch.kind === "multipleOf") {
        return true;
      } else if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      } else if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return Number.isFinite(min) && Number.isFinite(max);
  }
};
ZodNumber.create = (params) => {
  return new ZodNumber({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodNumber,
    coerce: params?.coerce || false,
    ...processCreateParams(params)
  });
};
var ZodBigInt = class _ZodBigInt extends ZodType {
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
  }
  _parse(input) {
    if (this._def.coerce) {
      try {
        input.data = BigInt(input.data);
      } catch {
        return this._getInvalidInput(input);
      }
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.bigint) {
      return this._getInvalidInput(input);
    }
    let ctx = void 0;
    const status = new ParseStatus();
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            type: "bigint",
            minimum: check.value,
            inclusive: check.inclusive,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            type: "bigint",
            maximum: check.value,
            inclusive: check.inclusive,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "multipleOf") {
        if (input.data % check.value !== BigInt(0)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_multiple_of,
            multipleOf: check.value,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  _getInvalidInput(input) {
    const ctx = this._getOrReturnCtx(input);
    addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.bigint,
      received: ctx.parsedType
    });
    return INVALID;
  }
  gte(value, message) {
    return this.setLimit("min", value, true, errorUtil.toString(message));
  }
  gt(value, message) {
    return this.setLimit("min", value, false, errorUtil.toString(message));
  }
  lte(value, message) {
    return this.setLimit("max", value, true, errorUtil.toString(message));
  }
  lt(value, message) {
    return this.setLimit("max", value, false, errorUtil.toString(message));
  }
  setLimit(kind, value, inclusive, message) {
    return new _ZodBigInt({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check) {
    return new _ZodBigInt({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: "multipleOf",
      value,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxValue() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
};
ZodBigInt.create = (params) => {
  return new ZodBigInt({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodBigInt,
    coerce: params?.coerce ?? false,
    ...processCreateParams(params)
  });
};
var ZodBoolean = class extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = Boolean(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.boolean) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.boolean,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodBoolean.create = (params) => {
  return new ZodBoolean({
    typeName: ZodFirstPartyTypeKind.ZodBoolean,
    coerce: params?.coerce || false,
    ...processCreateParams(params)
  });
};
var ZodDate = class _ZodDate extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = new Date(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.date) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.date,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    if (Number.isNaN(input.data.getTime())) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_date
      });
      return INVALID;
    }
    const status = new ParseStatus();
    let ctx = void 0;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        if (input.data.getTime() < check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            message: check.message,
            inclusive: true,
            exact: false,
            minimum: check.value,
            type: "date"
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        if (input.data.getTime() > check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            message: check.message,
            inclusive: true,
            exact: false,
            maximum: check.value,
            type: "date"
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return {
      status: status.value,
      value: new Date(input.data.getTime())
    };
  }
  _addCheck(check) {
    return new _ZodDate({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  min(minDate, message) {
    return this._addCheck({
      kind: "min",
      value: minDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  max(maxDate, message) {
    return this._addCheck({
      kind: "max",
      value: maxDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  get minDate() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min != null ? new Date(min) : null;
  }
  get maxDate() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max != null ? new Date(max) : null;
  }
};
ZodDate.create = (params) => {
  return new ZodDate({
    checks: [],
    coerce: params?.coerce || false,
    typeName: ZodFirstPartyTypeKind.ZodDate,
    ...processCreateParams(params)
  });
};
var ZodSymbol = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.symbol) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.symbol,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodSymbol.create = (params) => {
  return new ZodSymbol({
    typeName: ZodFirstPartyTypeKind.ZodSymbol,
    ...processCreateParams(params)
  });
};
var ZodUndefined = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.undefined,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodUndefined.create = (params) => {
  return new ZodUndefined({
    typeName: ZodFirstPartyTypeKind.ZodUndefined,
    ...processCreateParams(params)
  });
};
var ZodNull = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.null) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.null,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodNull.create = (params) => {
  return new ZodNull({
    typeName: ZodFirstPartyTypeKind.ZodNull,
    ...processCreateParams(params)
  });
};
var ZodAny = class extends ZodType {
  constructor() {
    super(...arguments);
    this._any = true;
  }
  _parse(input) {
    return OK(input.data);
  }
};
ZodAny.create = (params) => {
  return new ZodAny({
    typeName: ZodFirstPartyTypeKind.ZodAny,
    ...processCreateParams(params)
  });
};
var ZodUnknown = class extends ZodType {
  constructor() {
    super(...arguments);
    this._unknown = true;
  }
  _parse(input) {
    return OK(input.data);
  }
};
ZodUnknown.create = (params) => {
  return new ZodUnknown({
    typeName: ZodFirstPartyTypeKind.ZodUnknown,
    ...processCreateParams(params)
  });
};
var ZodNever = class extends ZodType {
  _parse(input) {
    const ctx = this._getOrReturnCtx(input);
    addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.never,
      received: ctx.parsedType
    });
    return INVALID;
  }
};
ZodNever.create = (params) => {
  return new ZodNever({
    typeName: ZodFirstPartyTypeKind.ZodNever,
    ...processCreateParams(params)
  });
};
var ZodVoid = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.void,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodVoid.create = (params) => {
  return new ZodVoid({
    typeName: ZodFirstPartyTypeKind.ZodVoid,
    ...processCreateParams(params)
  });
};
var ZodArray = class _ZodArray extends ZodType {
  _parse(input) {
    const { ctx, status } = this._processInputParams(input);
    const def = this._def;
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      });
      return INVALID;
    }
    if (def.exactLength !== null) {
      const tooBig = ctx.data.length > def.exactLength.value;
      const tooSmall = ctx.data.length < def.exactLength.value;
      if (tooBig || tooSmall) {
        addIssueToContext(ctx, {
          code: tooBig ? ZodIssueCode.too_big : ZodIssueCode.too_small,
          minimum: tooSmall ? def.exactLength.value : void 0,
          maximum: tooBig ? def.exactLength.value : void 0,
          type: "array",
          inclusive: true,
          exact: true,
          message: def.exactLength.message
        });
        status.dirty();
      }
    }
    if (def.minLength !== null) {
      if (ctx.data.length < def.minLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minLength.value,
          type: "array",
          inclusive: true,
          exact: false,
          message: def.minLength.message
        });
        status.dirty();
      }
    }
    if (def.maxLength !== null) {
      if (ctx.data.length > def.maxLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxLength.value,
          type: "array",
          inclusive: true,
          exact: false,
          message: def.maxLength.message
        });
        status.dirty();
      }
    }
    if (ctx.common.async) {
      return Promise.all([...ctx.data].map((item, i) => {
        return def.type._parseAsync(new ParseInputLazyPath(ctx, item, ctx.path, i));
      })).then((result2) => {
        return ParseStatus.mergeArray(status, result2);
      });
    }
    const result = [...ctx.data].map((item, i) => {
      return def.type._parseSync(new ParseInputLazyPath(ctx, item, ctx.path, i));
    });
    return ParseStatus.mergeArray(status, result);
  }
  get element() {
    return this._def.type;
  }
  min(minLength, message) {
    return new _ZodArray({
      ...this._def,
      minLength: { value: minLength, message: errorUtil.toString(message) }
    });
  }
  max(maxLength, message) {
    return new _ZodArray({
      ...this._def,
      maxLength: { value: maxLength, message: errorUtil.toString(message) }
    });
  }
  length(len, message) {
    return new _ZodArray({
      ...this._def,
      exactLength: { value: len, message: errorUtil.toString(message) }
    });
  }
  nonempty(message) {
    return this.min(1, message);
  }
};
ZodArray.create = (schema, params) => {
  return new ZodArray({
    type: schema,
    minLength: null,
    maxLength: null,
    exactLength: null,
    typeName: ZodFirstPartyTypeKind.ZodArray,
    ...processCreateParams(params)
  });
};
function deepPartialify(schema) {
  if (schema instanceof ZodObject) {
    const newShape = {};
    for (const key in schema.shape) {
      const fieldSchema = schema.shape[key];
      newShape[key] = ZodOptional.create(deepPartialify(fieldSchema));
    }
    return new ZodObject({
      ...schema._def,
      shape: () => newShape
    });
  } else if (schema instanceof ZodArray) {
    return new ZodArray({
      ...schema._def,
      type: deepPartialify(schema.element)
    });
  } else if (schema instanceof ZodOptional) {
    return ZodOptional.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodNullable) {
    return ZodNullable.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodTuple) {
    return ZodTuple.create(schema.items.map((item) => deepPartialify(item)));
  } else {
    return schema;
  }
}
var ZodObject = class _ZodObject extends ZodType {
  constructor() {
    super(...arguments);
    this._cached = null;
    this.nonstrict = this.passthrough;
    this.augment = this.extend;
  }
  _getCached() {
    if (this._cached !== null)
      return this._cached;
    const shape = this._def.shape();
    const keys = util.objectKeys(shape);
    this._cached = { shape, keys };
    return this._cached;
  }
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.object) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    const { status, ctx } = this._processInputParams(input);
    const { shape, keys: shapeKeys } = this._getCached();
    const extraKeys = [];
    if (!(this._def.catchall instanceof ZodNever && this._def.unknownKeys === "strip")) {
      for (const key in ctx.data) {
        if (!shapeKeys.includes(key)) {
          extraKeys.push(key);
        }
      }
    }
    const pairs = [];
    for (const key of shapeKeys) {
      const keyValidator = shape[key];
      const value = ctx.data[key];
      pairs.push({
        key: { status: "valid", value: key },
        value: keyValidator._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
        alwaysSet: key in ctx.data
      });
    }
    if (this._def.catchall instanceof ZodNever) {
      const unknownKeys = this._def.unknownKeys;
      if (unknownKeys === "passthrough") {
        for (const key of extraKeys) {
          pairs.push({
            key: { status: "valid", value: key },
            value: { status: "valid", value: ctx.data[key] }
          });
        }
      } else if (unknownKeys === "strict") {
        if (extraKeys.length > 0) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.unrecognized_keys,
            keys: extraKeys
          });
          status.dirty();
        }
      } else if (unknownKeys === "strip") {
      } else {
        throw new Error(`Internal ZodObject error: invalid unknownKeys value.`);
      }
    } else {
      const catchall = this._def.catchall;
      for (const key of extraKeys) {
        const value = ctx.data[key];
        pairs.push({
          key: { status: "valid", value: key },
          value: catchall._parse(
            new ParseInputLazyPath(ctx, value, ctx.path, key)
            //, ctx.child(key), value, getParsedType(value)
          ),
          alwaysSet: key in ctx.data
        });
      }
    }
    if (ctx.common.async) {
      return Promise.resolve().then(async () => {
        const syncPairs = [];
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;
          syncPairs.push({
            key,
            value,
            alwaysSet: pair.alwaysSet
          });
        }
        return syncPairs;
      }).then((syncPairs) => {
        return ParseStatus.mergeObjectSync(status, syncPairs);
      });
    } else {
      return ParseStatus.mergeObjectSync(status, pairs);
    }
  }
  get shape() {
    return this._def.shape();
  }
  strict(message) {
    errorUtil.errToObj;
    return new _ZodObject({
      ...this._def,
      unknownKeys: "strict",
      ...message !== void 0 ? {
        errorMap: (issue, ctx) => {
          const defaultError = this._def.errorMap?.(issue, ctx).message ?? ctx.defaultError;
          if (issue.code === "unrecognized_keys")
            return {
              message: errorUtil.errToObj(message).message ?? defaultError
            };
          return {
            message: defaultError
          };
        }
      } : {}
    });
  }
  strip() {
    return new _ZodObject({
      ...this._def,
      unknownKeys: "strip"
    });
  }
  passthrough() {
    return new _ZodObject({
      ...this._def,
      unknownKeys: "passthrough"
    });
  }
  // const AugmentFactory =
  //   <Def extends ZodObjectDef>(def: Def) =>
  //   <Augmentation extends ZodRawShape>(
  //     augmentation: Augmentation
  //   ): ZodObject<
  //     extendShape<ReturnType<Def["shape"]>, Augmentation>,
  //     Def["unknownKeys"],
  //     Def["catchall"]
  //   > => {
  //     return new ZodObject({
  //       ...def,
  //       shape: () => ({
  //         ...def.shape(),
  //         ...augmentation,
  //       }),
  //     }) as any;
  //   };
  extend(augmentation) {
    return new _ZodObject({
      ...this._def,
      shape: () => ({
        ...this._def.shape(),
        ...augmentation
      })
    });
  }
  /**
   * Prior to zod@1.0.12 there was a bug in the
   * inferred type of merged objects. Please
   * upgrade if you are experiencing issues.
   */
  merge(merging) {
    const merged = new _ZodObject({
      unknownKeys: merging._def.unknownKeys,
      catchall: merging._def.catchall,
      shape: () => ({
        ...this._def.shape(),
        ...merging._def.shape()
      }),
      typeName: ZodFirstPartyTypeKind.ZodObject
    });
    return merged;
  }
  // merge<
  //   Incoming extends AnyZodObject,
  //   Augmentation extends Incoming["shape"],
  //   NewOutput extends {
  //     [k in keyof Augmentation | keyof Output]: k extends keyof Augmentation
  //       ? Augmentation[k]["_output"]
  //       : k extends keyof Output
  //       ? Output[k]
  //       : never;
  //   },
  //   NewInput extends {
  //     [k in keyof Augmentation | keyof Input]: k extends keyof Augmentation
  //       ? Augmentation[k]["_input"]
  //       : k extends keyof Input
  //       ? Input[k]
  //       : never;
  //   }
  // >(
  //   merging: Incoming
  // ): ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"],
  //   NewOutput,
  //   NewInput
  // > {
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   }) as any;
  //   return merged;
  // }
  setKey(key, schema) {
    return this.augment({ [key]: schema });
  }
  // merge<Incoming extends AnyZodObject>(
  //   merging: Incoming
  // ): //ZodObject<T & Incoming["_shape"], UnknownKeys, Catchall> = (merging) => {
  // ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"]
  // > {
  //   // const mergedShape = objectUtil.mergeShapes(
  //   //   this._def.shape(),
  //   //   merging._def.shape()
  //   // );
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   }) as any;
  //   return merged;
  // }
  catchall(index) {
    return new _ZodObject({
      ...this._def,
      catchall: index
    });
  }
  pick(mask) {
    const shape = {};
    for (const key of util.objectKeys(mask)) {
      if (mask[key] && this.shape[key]) {
        shape[key] = this.shape[key];
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => shape
    });
  }
  omit(mask) {
    const shape = {};
    for (const key of util.objectKeys(this.shape)) {
      if (!mask[key]) {
        shape[key] = this.shape[key];
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => shape
    });
  }
  /**
   * @deprecated
   */
  deepPartial() {
    return deepPartialify(this);
  }
  partial(mask) {
    const newShape = {};
    for (const key of util.objectKeys(this.shape)) {
      const fieldSchema = this.shape[key];
      if (mask && !mask[key]) {
        newShape[key] = fieldSchema;
      } else {
        newShape[key] = fieldSchema.optional();
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => newShape
    });
  }
  required(mask) {
    const newShape = {};
    for (const key of util.objectKeys(this.shape)) {
      if (mask && !mask[key]) {
        newShape[key] = this.shape[key];
      } else {
        const fieldSchema = this.shape[key];
        let newField = fieldSchema;
        while (newField instanceof ZodOptional) {
          newField = newField._def.innerType;
        }
        newShape[key] = newField;
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => newShape
    });
  }
  keyof() {
    return createZodEnum(util.objectKeys(this.shape));
  }
};
ZodObject.create = (shape, params) => {
  return new ZodObject({
    shape: () => shape,
    unknownKeys: "strip",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
ZodObject.strictCreate = (shape, params) => {
  return new ZodObject({
    shape: () => shape,
    unknownKeys: "strict",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
ZodObject.lazycreate = (shape, params) => {
  return new ZodObject({
    shape,
    unknownKeys: "strip",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
var ZodUnion = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const options = this._def.options;
    function handleResults(results) {
      for (const result of results) {
        if (result.result.status === "valid") {
          return result.result;
        }
      }
      for (const result of results) {
        if (result.result.status === "dirty") {
          ctx.common.issues.push(...result.ctx.common.issues);
          return result.result;
        }
      }
      const unionErrors = results.map((result) => new ZodError(result.ctx.common.issues));
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors
      });
      return INVALID;
    }
    if (ctx.common.async) {
      return Promise.all(options.map(async (option) => {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        return {
          result: await option._parseAsync({
            data: ctx.data,
            path: ctx.path,
            parent: childCtx
          }),
          ctx: childCtx
        };
      })).then(handleResults);
    } else {
      let dirty = void 0;
      const issues = [];
      for (const option of options) {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        const result = option._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: childCtx
        });
        if (result.status === "valid") {
          return result;
        } else if (result.status === "dirty" && !dirty) {
          dirty = { result, ctx: childCtx };
        }
        if (childCtx.common.issues.length) {
          issues.push(childCtx.common.issues);
        }
      }
      if (dirty) {
        ctx.common.issues.push(...dirty.ctx.common.issues);
        return dirty.result;
      }
      const unionErrors = issues.map((issues2) => new ZodError(issues2));
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors
      });
      return INVALID;
    }
  }
  get options() {
    return this._def.options;
  }
};
ZodUnion.create = (types, params) => {
  return new ZodUnion({
    options: types,
    typeName: ZodFirstPartyTypeKind.ZodUnion,
    ...processCreateParams(params)
  });
};
var getDiscriminator = (type) => {
  if (type instanceof ZodLazy) {
    return getDiscriminator(type.schema);
  } else if (type instanceof ZodEffects) {
    return getDiscriminator(type.innerType());
  } else if (type instanceof ZodLiteral) {
    return [type.value];
  } else if (type instanceof ZodEnum) {
    return type.options;
  } else if (type instanceof ZodNativeEnum) {
    return util.objectValues(type.enum);
  } else if (type instanceof ZodDefault) {
    return getDiscriminator(type._def.innerType);
  } else if (type instanceof ZodUndefined) {
    return [void 0];
  } else if (type instanceof ZodNull) {
    return [null];
  } else if (type instanceof ZodOptional) {
    return [void 0, ...getDiscriminator(type.unwrap())];
  } else if (type instanceof ZodNullable) {
    return [null, ...getDiscriminator(type.unwrap())];
  } else if (type instanceof ZodBranded) {
    return getDiscriminator(type.unwrap());
  } else if (type instanceof ZodReadonly) {
    return getDiscriminator(type.unwrap());
  } else if (type instanceof ZodCatch) {
    return getDiscriminator(type._def.innerType);
  } else {
    return [];
  }
};
var ZodDiscriminatedUnion = class _ZodDiscriminatedUnion extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const discriminator = this.discriminator;
    const discriminatorValue = ctx.data[discriminator];
    const option = this.optionsMap.get(discriminatorValue);
    if (!option) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union_discriminator,
        options: Array.from(this.optionsMap.keys()),
        path: [discriminator]
      });
      return INVALID;
    }
    if (ctx.common.async) {
      return option._parseAsync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
    } else {
      return option._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
    }
  }
  get discriminator() {
    return this._def.discriminator;
  }
  get options() {
    return this._def.options;
  }
  get optionsMap() {
    return this._def.optionsMap;
  }
  /**
   * The constructor of the discriminated union schema. Its behaviour is very similar to that of the normal z.union() constructor.
   * However, it only allows a union of objects, all of which need to share a discriminator property. This property must
   * have a different value for each object in the union.
   * @param discriminator the name of the discriminator property
   * @param types an array of object schemas
   * @param params
   */
  static create(discriminator, options, params) {
    const optionsMap = /* @__PURE__ */ new Map();
    for (const type of options) {
      const discriminatorValues = getDiscriminator(type.shape[discriminator]);
      if (!discriminatorValues.length) {
        throw new Error(`A discriminator value for key \`${discriminator}\` could not be extracted from all schema options`);
      }
      for (const value of discriminatorValues) {
        if (optionsMap.has(value)) {
          throw new Error(`Discriminator property ${String(discriminator)} has duplicate value ${String(value)}`);
        }
        optionsMap.set(value, type);
      }
    }
    return new _ZodDiscriminatedUnion({
      typeName: ZodFirstPartyTypeKind.ZodDiscriminatedUnion,
      discriminator,
      options,
      optionsMap,
      ...processCreateParams(params)
    });
  }
};
function mergeValues(a, b) {
  const aType = getParsedType(a);
  const bType = getParsedType(b);
  if (a === b) {
    return { valid: true, data: a };
  } else if (aType === ZodParsedType.object && bType === ZodParsedType.object) {
    const bKeys = util.objectKeys(b);
    const sharedKeys = util.objectKeys(a).filter((key) => bKeys.indexOf(key) !== -1);
    const newObj = { ...a, ...b };
    for (const key of sharedKeys) {
      const sharedValue = mergeValues(a[key], b[key]);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newObj[key] = sharedValue.data;
    }
    return { valid: true, data: newObj };
  } else if (aType === ZodParsedType.array && bType === ZodParsedType.array) {
    if (a.length !== b.length) {
      return { valid: false };
    }
    const newArray = [];
    for (let index = 0; index < a.length; index++) {
      const itemA = a[index];
      const itemB = b[index];
      const sharedValue = mergeValues(itemA, itemB);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newArray.push(sharedValue.data);
    }
    return { valid: true, data: newArray };
  } else if (aType === ZodParsedType.date && bType === ZodParsedType.date && +a === +b) {
    return { valid: true, data: a };
  } else {
    return { valid: false };
  }
}
var ZodIntersection = class extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const handleParsed = (parsedLeft, parsedRight) => {
      if (isAborted(parsedLeft) || isAborted(parsedRight)) {
        return INVALID;
      }
      const merged = mergeValues(parsedLeft.value, parsedRight.value);
      if (!merged.valid) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_intersection_types
        });
        return INVALID;
      }
      if (isDirty(parsedLeft) || isDirty(parsedRight)) {
        status.dirty();
      }
      return { status: status.value, value: merged.data };
    };
    if (ctx.common.async) {
      return Promise.all([
        this._def.left._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        }),
        this._def.right._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        })
      ]).then(([left, right]) => handleParsed(left, right));
    } else {
      return handleParsed(this._def.left._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }), this._def.right._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }));
    }
  }
};
ZodIntersection.create = (left, right, params) => {
  return new ZodIntersection({
    left,
    right,
    typeName: ZodFirstPartyTypeKind.ZodIntersection,
    ...processCreateParams(params)
  });
};
var ZodTuple = class _ZodTuple extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      });
      return INVALID;
    }
    if (ctx.data.length < this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_small,
        minimum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: "array"
      });
      return INVALID;
    }
    const rest = this._def.rest;
    if (!rest && ctx.data.length > this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_big,
        maximum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: "array"
      });
      status.dirty();
    }
    const items = [...ctx.data].map((item, itemIndex) => {
      const schema = this._def.items[itemIndex] || this._def.rest;
      if (!schema)
        return null;
      return schema._parse(new ParseInputLazyPath(ctx, item, ctx.path, itemIndex));
    }).filter((x) => !!x);
    if (ctx.common.async) {
      return Promise.all(items).then((results) => {
        return ParseStatus.mergeArray(status, results);
      });
    } else {
      return ParseStatus.mergeArray(status, items);
    }
  }
  get items() {
    return this._def.items;
  }
  rest(rest) {
    return new _ZodTuple({
      ...this._def,
      rest
    });
  }
};
ZodTuple.create = (schemas, params) => {
  if (!Array.isArray(schemas)) {
    throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
  }
  return new ZodTuple({
    items: schemas,
    typeName: ZodFirstPartyTypeKind.ZodTuple,
    rest: null,
    ...processCreateParams(params)
  });
};
var ZodRecord = class _ZodRecord extends ZodType {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const pairs = [];
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    for (const key in ctx.data) {
      pairs.push({
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, key)),
        value: valueType._parse(new ParseInputLazyPath(ctx, ctx.data[key], ctx.path, key)),
        alwaysSet: key in ctx.data
      });
    }
    if (ctx.common.async) {
      return ParseStatus.mergeObjectAsync(status, pairs);
    } else {
      return ParseStatus.mergeObjectSync(status, pairs);
    }
  }
  get element() {
    return this._def.valueType;
  }
  static create(first, second, third) {
    if (second instanceof ZodType) {
      return new _ZodRecord({
        keyType: first,
        valueType: second,
        typeName: ZodFirstPartyTypeKind.ZodRecord,
        ...processCreateParams(third)
      });
    }
    return new _ZodRecord({
      keyType: ZodString.create(),
      valueType: first,
      typeName: ZodFirstPartyTypeKind.ZodRecord,
      ...processCreateParams(second)
    });
  }
};
var ZodMap = class extends ZodType {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.map) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.map,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    const pairs = [...ctx.data.entries()].map(([key, value], index) => {
      return {
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, [index, "key"])),
        value: valueType._parse(new ParseInputLazyPath(ctx, value, ctx.path, [index, "value"]))
      };
    });
    if (ctx.common.async) {
      const finalMap = /* @__PURE__ */ new Map();
      return Promise.resolve().then(async () => {
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;
          if (key.status === "aborted" || value.status === "aborted") {
            return INVALID;
          }
          if (key.status === "dirty" || value.status === "dirty") {
            status.dirty();
          }
          finalMap.set(key.value, value.value);
        }
        return { status: status.value, value: finalMap };
      });
    } else {
      const finalMap = /* @__PURE__ */ new Map();
      for (const pair of pairs) {
        const key = pair.key;
        const value = pair.value;
        if (key.status === "aborted" || value.status === "aborted") {
          return INVALID;
        }
        if (key.status === "dirty" || value.status === "dirty") {
          status.dirty();
        }
        finalMap.set(key.value, value.value);
      }
      return { status: status.value, value: finalMap };
    }
  }
};
ZodMap.create = (keyType, valueType, params) => {
  return new ZodMap({
    valueType,
    keyType,
    typeName: ZodFirstPartyTypeKind.ZodMap,
    ...processCreateParams(params)
  });
};
var ZodSet = class _ZodSet extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.set) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.set,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const def = this._def;
    if (def.minSize !== null) {
      if (ctx.data.size < def.minSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minSize.value,
          type: "set",
          inclusive: true,
          exact: false,
          message: def.minSize.message
        });
        status.dirty();
      }
    }
    if (def.maxSize !== null) {
      if (ctx.data.size > def.maxSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxSize.value,
          type: "set",
          inclusive: true,
          exact: false,
          message: def.maxSize.message
        });
        status.dirty();
      }
    }
    const valueType = this._def.valueType;
    function finalizeSet(elements2) {
      const parsedSet = /* @__PURE__ */ new Set();
      for (const element of elements2) {
        if (element.status === "aborted")
          return INVALID;
        if (element.status === "dirty")
          status.dirty();
        parsedSet.add(element.value);
      }
      return { status: status.value, value: parsedSet };
    }
    const elements = [...ctx.data.values()].map((item, i) => valueType._parse(new ParseInputLazyPath(ctx, item, ctx.path, i)));
    if (ctx.common.async) {
      return Promise.all(elements).then((elements2) => finalizeSet(elements2));
    } else {
      return finalizeSet(elements);
    }
  }
  min(minSize, message) {
    return new _ZodSet({
      ...this._def,
      minSize: { value: minSize, message: errorUtil.toString(message) }
    });
  }
  max(maxSize, message) {
    return new _ZodSet({
      ...this._def,
      maxSize: { value: maxSize, message: errorUtil.toString(message) }
    });
  }
  size(size, message) {
    return this.min(size, message).max(size, message);
  }
  nonempty(message) {
    return this.min(1, message);
  }
};
ZodSet.create = (valueType, params) => {
  return new ZodSet({
    valueType,
    minSize: null,
    maxSize: null,
    typeName: ZodFirstPartyTypeKind.ZodSet,
    ...processCreateParams(params)
  });
};
var ZodFunction = class _ZodFunction extends ZodType {
  constructor() {
    super(...arguments);
    this.validate = this.implement;
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.function) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.function,
        received: ctx.parsedType
      });
      return INVALID;
    }
    function makeArgsIssue(args, error) {
      return makeIssue({
        data: args,
        path: ctx.path,
        errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default].filter((x) => !!x),
        issueData: {
          code: ZodIssueCode.invalid_arguments,
          argumentsError: error
        }
      });
    }
    function makeReturnsIssue(returns, error) {
      return makeIssue({
        data: returns,
        path: ctx.path,
        errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default].filter((x) => !!x),
        issueData: {
          code: ZodIssueCode.invalid_return_type,
          returnTypeError: error
        }
      });
    }
    const params = { errorMap: ctx.common.contextualErrorMap };
    const fn = ctx.data;
    if (this._def.returns instanceof ZodPromise) {
      const me = this;
      return OK(async function(...args) {
        const error = new ZodError([]);
        const parsedArgs = await me._def.args.parseAsync(args, params).catch((e) => {
          error.addIssue(makeArgsIssue(args, e));
          throw error;
        });
        const result = await Reflect.apply(fn, this, parsedArgs);
        const parsedReturns = await me._def.returns._def.type.parseAsync(result, params).catch((e) => {
          error.addIssue(makeReturnsIssue(result, e));
          throw error;
        });
        return parsedReturns;
      });
    } else {
      const me = this;
      return OK(function(...args) {
        const parsedArgs = me._def.args.safeParse(args, params);
        if (!parsedArgs.success) {
          throw new ZodError([makeArgsIssue(args, parsedArgs.error)]);
        }
        const result = Reflect.apply(fn, this, parsedArgs.data);
        const parsedReturns = me._def.returns.safeParse(result, params);
        if (!parsedReturns.success) {
          throw new ZodError([makeReturnsIssue(result, parsedReturns.error)]);
        }
        return parsedReturns.data;
      });
    }
  }
  parameters() {
    return this._def.args;
  }
  returnType() {
    return this._def.returns;
  }
  args(...items) {
    return new _ZodFunction({
      ...this._def,
      args: ZodTuple.create(items).rest(ZodUnknown.create())
    });
  }
  returns(returnType) {
    return new _ZodFunction({
      ...this._def,
      returns: returnType
    });
  }
  implement(func) {
    const validatedFunc = this.parse(func);
    return validatedFunc;
  }
  strictImplement(func) {
    const validatedFunc = this.parse(func);
    return validatedFunc;
  }
  static create(args, returns, params) {
    return new _ZodFunction({
      args: args ? args : ZodTuple.create([]).rest(ZodUnknown.create()),
      returns: returns || ZodUnknown.create(),
      typeName: ZodFirstPartyTypeKind.ZodFunction,
      ...processCreateParams(params)
    });
  }
};
var ZodLazy = class extends ZodType {
  get schema() {
    return this._def.getter();
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const lazySchema = this._def.getter();
    return lazySchema._parse({ data: ctx.data, path: ctx.path, parent: ctx });
  }
};
ZodLazy.create = (getter, params) => {
  return new ZodLazy({
    getter,
    typeName: ZodFirstPartyTypeKind.ZodLazy,
    ...processCreateParams(params)
  });
};
var ZodLiteral = class extends ZodType {
  _parse(input) {
    if (input.data !== this._def.value) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_literal,
        expected: this._def.value
      });
      return INVALID;
    }
    return { status: "valid", value: input.data };
  }
  get value() {
    return this._def.value;
  }
};
ZodLiteral.create = (value, params) => {
  return new ZodLiteral({
    value,
    typeName: ZodFirstPartyTypeKind.ZodLiteral,
    ...processCreateParams(params)
  });
};
function createZodEnum(values, params) {
  return new ZodEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodEnum,
    ...processCreateParams(params)
  });
}
var ZodEnum = class _ZodEnum extends ZodType {
  _parse(input) {
    if (typeof input.data !== "string") {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type
      });
      return INVALID;
    }
    if (!this._cache) {
      this._cache = new Set(this._def.values);
    }
    if (!this._cache.has(input.data)) {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues
      });
      return INVALID;
    }
    return OK(input.data);
  }
  get options() {
    return this._def.values;
  }
  get enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Values() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  extract(values, newDef = this._def) {
    return _ZodEnum.create(values, {
      ...this._def,
      ...newDef
    });
  }
  exclude(values, newDef = this._def) {
    return _ZodEnum.create(this.options.filter((opt) => !values.includes(opt)), {
      ...this._def,
      ...newDef
    });
  }
};
ZodEnum.create = createZodEnum;
var ZodNativeEnum = class extends ZodType {
  _parse(input) {
    const nativeEnumValues = util.getValidEnumValues(this._def.values);
    const ctx = this._getOrReturnCtx(input);
    if (ctx.parsedType !== ZodParsedType.string && ctx.parsedType !== ZodParsedType.number) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type
      });
      return INVALID;
    }
    if (!this._cache) {
      this._cache = new Set(util.getValidEnumValues(this._def.values));
    }
    if (!this._cache.has(input.data)) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues
      });
      return INVALID;
    }
    return OK(input.data);
  }
  get enum() {
    return this._def.values;
  }
};
ZodNativeEnum.create = (values, params) => {
  return new ZodNativeEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodNativeEnum,
    ...processCreateParams(params)
  });
};
var ZodPromise = class extends ZodType {
  unwrap() {
    return this._def.type;
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.promise && ctx.common.async === false) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.promise,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const promisified = ctx.parsedType === ZodParsedType.promise ? ctx.data : Promise.resolve(ctx.data);
    return OK(promisified.then((data) => {
      return this._def.type.parseAsync(data, {
        path: ctx.path,
        errorMap: ctx.common.contextualErrorMap
      });
    }));
  }
};
ZodPromise.create = (schema, params) => {
  return new ZodPromise({
    type: schema,
    typeName: ZodFirstPartyTypeKind.ZodPromise,
    ...processCreateParams(params)
  });
};
var ZodEffects = class extends ZodType {
  innerType() {
    return this._def.schema;
  }
  sourceType() {
    return this._def.schema._def.typeName === ZodFirstPartyTypeKind.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const effect = this._def.effect || null;
    const checkCtx = {
      addIssue: (arg) => {
        addIssueToContext(ctx, arg);
        if (arg.fatal) {
          status.abort();
        } else {
          status.dirty();
        }
      },
      get path() {
        return ctx.path;
      }
    };
    checkCtx.addIssue = checkCtx.addIssue.bind(checkCtx);
    if (effect.type === "preprocess") {
      const processed = effect.transform(ctx.data, checkCtx);
      if (ctx.common.async) {
        return Promise.resolve(processed).then(async (processed2) => {
          if (status.value === "aborted")
            return INVALID;
          const result = await this._def.schema._parseAsync({
            data: processed2,
            path: ctx.path,
            parent: ctx
          });
          if (result.status === "aborted")
            return INVALID;
          if (result.status === "dirty")
            return DIRTY(result.value);
          if (status.value === "dirty")
            return DIRTY(result.value);
          return result;
        });
      } else {
        if (status.value === "aborted")
          return INVALID;
        const result = this._def.schema._parseSync({
          data: processed,
          path: ctx.path,
          parent: ctx
        });
        if (result.status === "aborted")
          return INVALID;
        if (result.status === "dirty")
          return DIRTY(result.value);
        if (status.value === "dirty")
          return DIRTY(result.value);
        return result;
      }
    }
    if (effect.type === "refinement") {
      const executeRefinement = (acc) => {
        const result = effect.refinement(acc, checkCtx);
        if (ctx.common.async) {
          return Promise.resolve(result);
        }
        if (result instanceof Promise) {
          throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
        }
        return acc;
      };
      if (ctx.common.async === false) {
        const inner = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inner.status === "aborted")
          return INVALID;
        if (inner.status === "dirty")
          status.dirty();
        executeRefinement(inner.value);
        return { status: status.value, value: inner.value };
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((inner) => {
          if (inner.status === "aborted")
            return INVALID;
          if (inner.status === "dirty")
            status.dirty();
          return executeRefinement(inner.value).then(() => {
            return { status: status.value, value: inner.value };
          });
        });
      }
    }
    if (effect.type === "transform") {
      if (ctx.common.async === false) {
        const base = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (!isValid(base))
          return INVALID;
        const result = effect.transform(base.value, checkCtx);
        if (result instanceof Promise) {
          throw new Error(`Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.`);
        }
        return { status: status.value, value: result };
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((base) => {
          if (!isValid(base))
            return INVALID;
          return Promise.resolve(effect.transform(base.value, checkCtx)).then((result) => ({
            status: status.value,
            value: result
          }));
        });
      }
    }
    util.assertNever(effect);
  }
};
ZodEffects.create = (schema, effect, params) => {
  return new ZodEffects({
    schema,
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    effect,
    ...processCreateParams(params)
  });
};
ZodEffects.createWithPreprocess = (preprocess, schema, params) => {
  return new ZodEffects({
    schema,
    effect: { type: "preprocess", transform: preprocess },
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    ...processCreateParams(params)
  });
};
var ZodOptional = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType === ZodParsedType.undefined) {
      return OK(void 0);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodOptional.create = (type, params) => {
  return new ZodOptional({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodOptional,
    ...processCreateParams(params)
  });
};
var ZodNullable = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType === ZodParsedType.null) {
      return OK(null);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodNullable.create = (type, params) => {
  return new ZodNullable({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodNullable,
    ...processCreateParams(params)
  });
};
var ZodDefault = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    let data = ctx.data;
    if (ctx.parsedType === ZodParsedType.undefined) {
      data = this._def.defaultValue();
    }
    return this._def.innerType._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  removeDefault() {
    return this._def.innerType;
  }
};
ZodDefault.create = (type, params) => {
  return new ZodDefault({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodDefault,
    defaultValue: typeof params.default === "function" ? params.default : () => params.default,
    ...processCreateParams(params)
  });
};
var ZodCatch = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const newCtx = {
      ...ctx,
      common: {
        ...ctx.common,
        issues: []
      }
    };
    const result = this._def.innerType._parse({
      data: newCtx.data,
      path: newCtx.path,
      parent: {
        ...newCtx
      }
    });
    if (isAsync(result)) {
      return result.then((result2) => {
        return {
          status: "valid",
          value: result2.status === "valid" ? result2.value : this._def.catchValue({
            get error() {
              return new ZodError(newCtx.common.issues);
            },
            input: newCtx.data
          })
        };
      });
    } else {
      return {
        status: "valid",
        value: result.status === "valid" ? result.value : this._def.catchValue({
          get error() {
            return new ZodError(newCtx.common.issues);
          },
          input: newCtx.data
        })
      };
    }
  }
  removeCatch() {
    return this._def.innerType;
  }
};
ZodCatch.create = (type, params) => {
  return new ZodCatch({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodCatch,
    catchValue: typeof params.catch === "function" ? params.catch : () => params.catch,
    ...processCreateParams(params)
  });
};
var ZodNaN = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.nan) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.nan,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return { status: "valid", value: input.data };
  }
};
ZodNaN.create = (params) => {
  return new ZodNaN({
    typeName: ZodFirstPartyTypeKind.ZodNaN,
    ...processCreateParams(params)
  });
};
var BRAND = /* @__PURE__ */ Symbol("zod_brand");
var ZodBranded = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const data = ctx.data;
    return this._def.type._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  unwrap() {
    return this._def.type;
  }
};
var ZodPipeline = class _ZodPipeline extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.common.async) {
      const handleAsync = async () => {
        const inResult = await this._def.in._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inResult.status === "aborted")
          return INVALID;
        if (inResult.status === "dirty") {
          status.dirty();
          return DIRTY(inResult.value);
        } else {
          return this._def.out._parseAsync({
            data: inResult.value,
            path: ctx.path,
            parent: ctx
          });
        }
      };
      return handleAsync();
    } else {
      const inResult = this._def.in._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
      if (inResult.status === "aborted")
        return INVALID;
      if (inResult.status === "dirty") {
        status.dirty();
        return {
          status: "dirty",
          value: inResult.value
        };
      } else {
        return this._def.out._parseSync({
          data: inResult.value,
          path: ctx.path,
          parent: ctx
        });
      }
    }
  }
  static create(a, b) {
    return new _ZodPipeline({
      in: a,
      out: b,
      typeName: ZodFirstPartyTypeKind.ZodPipeline
    });
  }
};
var ZodReadonly = class extends ZodType {
  _parse(input) {
    const result = this._def.innerType._parse(input);
    const freeze = (data) => {
      if (isValid(data)) {
        data.value = Object.freeze(data.value);
      }
      return data;
    };
    return isAsync(result) ? result.then((data) => freeze(data)) : freeze(result);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodReadonly.create = (type, params) => {
  return new ZodReadonly({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodReadonly,
    ...processCreateParams(params)
  });
};
function cleanParams(params, data) {
  const p = typeof params === "function" ? params(data) : typeof params === "string" ? { message: params } : params;
  const p2 = typeof p === "string" ? { message: p } : p;
  return p2;
}
function custom(check, _params = {}, fatal) {
  if (check)
    return ZodAny.create().superRefine((data, ctx) => {
      const r = check(data);
      if (r instanceof Promise) {
        return r.then((r2) => {
          if (!r2) {
            const params = cleanParams(_params, data);
            const _fatal = params.fatal ?? fatal ?? true;
            ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
          }
        });
      }
      if (!r) {
        const params = cleanParams(_params, data);
        const _fatal = params.fatal ?? fatal ?? true;
        ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
      }
      return;
    });
  return ZodAny.create();
}
var late = {
  object: ZodObject.lazycreate
};
var ZodFirstPartyTypeKind;
(function(ZodFirstPartyTypeKind2) {
  ZodFirstPartyTypeKind2["ZodString"] = "ZodString";
  ZodFirstPartyTypeKind2["ZodNumber"] = "ZodNumber";
  ZodFirstPartyTypeKind2["ZodNaN"] = "ZodNaN";
  ZodFirstPartyTypeKind2["ZodBigInt"] = "ZodBigInt";
  ZodFirstPartyTypeKind2["ZodBoolean"] = "ZodBoolean";
  ZodFirstPartyTypeKind2["ZodDate"] = "ZodDate";
  ZodFirstPartyTypeKind2["ZodSymbol"] = "ZodSymbol";
  ZodFirstPartyTypeKind2["ZodUndefined"] = "ZodUndefined";
  ZodFirstPartyTypeKind2["ZodNull"] = "ZodNull";
  ZodFirstPartyTypeKind2["ZodAny"] = "ZodAny";
  ZodFirstPartyTypeKind2["ZodUnknown"] = "ZodUnknown";
  ZodFirstPartyTypeKind2["ZodNever"] = "ZodNever";
  ZodFirstPartyTypeKind2["ZodVoid"] = "ZodVoid";
  ZodFirstPartyTypeKind2["ZodArray"] = "ZodArray";
  ZodFirstPartyTypeKind2["ZodObject"] = "ZodObject";
  ZodFirstPartyTypeKind2["ZodUnion"] = "ZodUnion";
  ZodFirstPartyTypeKind2["ZodDiscriminatedUnion"] = "ZodDiscriminatedUnion";
  ZodFirstPartyTypeKind2["ZodIntersection"] = "ZodIntersection";
  ZodFirstPartyTypeKind2["ZodTuple"] = "ZodTuple";
  ZodFirstPartyTypeKind2["ZodRecord"] = "ZodRecord";
  ZodFirstPartyTypeKind2["ZodMap"] = "ZodMap";
  ZodFirstPartyTypeKind2["ZodSet"] = "ZodSet";
  ZodFirstPartyTypeKind2["ZodFunction"] = "ZodFunction";
  ZodFirstPartyTypeKind2["ZodLazy"] = "ZodLazy";
  ZodFirstPartyTypeKind2["ZodLiteral"] = "ZodLiteral";
  ZodFirstPartyTypeKind2["ZodEnum"] = "ZodEnum";
  ZodFirstPartyTypeKind2["ZodEffects"] = "ZodEffects";
  ZodFirstPartyTypeKind2["ZodNativeEnum"] = "ZodNativeEnum";
  ZodFirstPartyTypeKind2["ZodOptional"] = "ZodOptional";
  ZodFirstPartyTypeKind2["ZodNullable"] = "ZodNullable";
  ZodFirstPartyTypeKind2["ZodDefault"] = "ZodDefault";
  ZodFirstPartyTypeKind2["ZodCatch"] = "ZodCatch";
  ZodFirstPartyTypeKind2["ZodPromise"] = "ZodPromise";
  ZodFirstPartyTypeKind2["ZodBranded"] = "ZodBranded";
  ZodFirstPartyTypeKind2["ZodPipeline"] = "ZodPipeline";
  ZodFirstPartyTypeKind2["ZodReadonly"] = "ZodReadonly";
})(ZodFirstPartyTypeKind || (ZodFirstPartyTypeKind = {}));
var instanceOfType = (cls, params = {
  message: `Input not instance of ${cls.name}`
}) => custom((data) => data instanceof cls, params);
var stringType = ZodString.create;
var numberType = ZodNumber.create;
var nanType = ZodNaN.create;
var bigIntType = ZodBigInt.create;
var booleanType = ZodBoolean.create;
var dateType = ZodDate.create;
var symbolType = ZodSymbol.create;
var undefinedType = ZodUndefined.create;
var nullType = ZodNull.create;
var anyType = ZodAny.create;
var unknownType = ZodUnknown.create;
var neverType = ZodNever.create;
var voidType = ZodVoid.create;
var arrayType = ZodArray.create;
var objectType = ZodObject.create;
var strictObjectType = ZodObject.strictCreate;
var unionType = ZodUnion.create;
var discriminatedUnionType = ZodDiscriminatedUnion.create;
var intersectionType = ZodIntersection.create;
var tupleType = ZodTuple.create;
var recordType = ZodRecord.create;
var mapType = ZodMap.create;
var setType = ZodSet.create;
var functionType = ZodFunction.create;
var lazyType = ZodLazy.create;
var literalType = ZodLiteral.create;
var enumType = ZodEnum.create;
var nativeEnumType = ZodNativeEnum.create;
var promiseType = ZodPromise.create;
var effectsType = ZodEffects.create;
var optionalType = ZodOptional.create;
var nullableType = ZodNullable.create;
var preprocessType = ZodEffects.createWithPreprocess;
var pipelineType = ZodPipeline.create;
var ostring = () => stringType().optional();
var onumber = () => numberType().optional();
var oboolean = () => booleanType().optional();
var coerce = {
  string: ((arg) => ZodString.create({ ...arg, coerce: true })),
  number: ((arg) => ZodNumber.create({ ...arg, coerce: true })),
  boolean: ((arg) => ZodBoolean.create({
    ...arg,
    coerce: true
  })),
  bigint: ((arg) => ZodBigInt.create({ ...arg, coerce: true })),
  date: ((arg) => ZodDate.create({ ...arg, coerce: true }))
};
var NEVER = INVALID;

// ../../packages/db/dist/index.js
import { PrismaClient } from "@prisma/client";
import { PrismaClient as PrismaClient2 } from "@prisma/client";

// ../../packages/db/dist/ledger.js
import { Prisma } from "@prisma/client";
var HOUSE_EMAIL = "house@internal.vladfsbet";
var ACCOUNT_TYPES = ["AVAILABLE", "BONUS", "LOCKED", "PENDING"];
var LedgerError = class extends Error {
  code;
  constructor(code, message) {
    super(message);
    this.code = code;
    this.name = "LedgerError";
  }
};
function dec(value) {
  return new Prisma.Decimal(value);
}
function money(value) {
  return value.toFixed(8);
}
async function withSerializable(db, fn) {
  let last;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await db.$transaction(fn, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        timeout: 15e3,
        maxWait: 5e3
      });
    } catch (error) {
      last = error;
      const code = error.code;
      const metaCode = error.meta?.code;
      if (code === "P2034" || code === "40001" || metaCode === "40001") {
        await new Promise((resolve2) => setTimeout(resolve2, 25 * (attempt + 1)));
        continue;
      }
      throw error;
    }
  }
  throw last;
}
async function ensureHouseWallet(db, currency) {
  const now = /* @__PURE__ */ new Date();
  let house = await db.user.findUnique({ where: { email: HOUSE_EMAIL } });
  if (!house) {
    try {
      house = await db.user.create({
        data: {
          email: HOUSE_EMAIL,
          passwordHash: "unusable",
          country: "ZZ",
          currency,
          dateOfBirth: /* @__PURE__ */ new Date("1980-01-01"),
          termsAcceptedAt: now,
          privacyAcceptedAt: now,
          rgAcknowledgedAt: now,
          status: "LOCKED",
          realMoneyEligible: false,
          profile: { create: { firstName: "House", lastName: "Ledger" } }
        }
      });
    } catch (error) {
      const code = error.code;
      if (code !== "P2002") {
        throw error;
      }
      house = await db.user.findUniqueOrThrow({ where: { email: HOUSE_EMAIL } });
    }
  }
  let wallet = await db.wallet.findUnique({
    where: { userId_currency: { userId: house.id, currency } },
    include: { accounts: true }
  });
  if (!wallet) {
    wallet = await db.wallet.create({
      data: {
        userId: house.id,
        currency,
        accounts: {
          create: ACCOUNT_TYPES.map((type) => ({ type }))
        }
      },
      include: { accounts: true }
    });
  }
  return { house, wallet };
}
async function ensurePlayerWallets(db, userId, currency) {
  let wallet = await db.wallet.findUnique({
    where: { userId_currency: { userId, currency } },
    include: { accounts: true }
  });
  if (!wallet) {
    wallet = await db.wallet.create({
      data: {
        userId,
        currency,
        accounts: {
          create: ACCOUNT_TYPES.map((type) => ({ type }))
        }
      },
      include: { accounts: true }
    });
  } else if (wallet.accounts.length < ACCOUNT_TYPES.length) {
    const have = new Set(wallet.accounts.map((account) => account.type));
    for (const type of ACCOUNT_TYPES) {
      if (!have.has(type)) {
        await db.walletAccount.create({ data: { walletId: wallet.id, type } });
      }
    }
    wallet = await db.wallet.findUniqueOrThrow({
      where: { id: wallet.id },
      include: { accounts: true }
    });
  }
  await ensureHouseWallet(db, currency);
  return wallet;
}
async function getAvailableBalance(db, userId, currency) {
  const wallet = await db.wallet.findUnique({
    where: { userId_currency: { userId, currency } },
    include: { accounts: true }
  });
  const available = wallet?.accounts.find((account) => account.type === "AVAILABLE");
  if (!available) {
    return money(new Prisma.Decimal(0));
  }
  return money(available.cachedBalance);
}
async function getWalletSnapshot(db, userId, currency) {
  const wallet = await db.wallet.findUnique({
    where: { userId_currency: { userId, currency } },
    include: { accounts: true }
  });
  if (!wallet) {
    return null;
  }
  const byType = Object.fromEntries(wallet.accounts.map((account) => [account.type, money(account.cachedBalance)]));
  return {
    walletId: wallet.id,
    currency: wallet.currency,
    status: wallet.status,
    available: byType.AVAILABLE ?? money(new Prisma.Decimal(0)),
    bonus: byType.BONUS ?? money(new Prisma.Decimal(0)),
    locked: byType.LOCKED ?? money(new Prisma.Decimal(0)),
    pending: byType.PENDING ?? money(new Prisma.Decimal(0))
  };
}
async function lockAccount(tx, id) {
  await tx.$queryRaw`
    SELECT id FROM wallet_accounts WHERE id = ${id}::uuid FOR UPDATE
  `;
}
async function postJournal(db, input) {
  const existing = await db.ledgerJournal.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
    include: { lines: true, transaction: true }
  });
  if (existing) {
    return { journal: existing, reused: true };
  }
  if (!input.lines.length) {
    throw new LedgerError("UNBALANCED", "Journal needs at least two lines");
  }
  const amounts = input.lines.map((line) => dec(line.amount));
  if (amounts.some((amount) => amount.lte(0))) {
    throw new LedgerError("INVALID_AMOUNT", "Line amounts must be greater than zero");
  }
  let debit = new Prisma.Decimal(0);
  let credit = new Prisma.Decimal(0);
  for (let i = 0; i < input.lines.length; i++) {
    if (input.lines[i].direction === "DEBIT") {
      debit = debit.add(amounts[i]);
    } else {
      credit = credit.add(amounts[i]);
    }
  }
  if (!debit.eq(credit)) {
    throw new LedgerError("UNBALANCED", "Debits must equal credits");
  }
  try {
    return await withSerializable(db, async (tx) => {
      const replay = await tx.ledgerJournal.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
        include: { lines: true, transaction: true }
      });
      if (replay) {
        return { journal: replay, reused: true };
      }
      const playerWallet = await ensurePlayerWallets(tx, input.userId, input.currency);
      if (playerWallet.status !== "ACTIVE") {
        throw new LedgerError("WALLET_FROZEN", "Player wallet is not active");
      }
      const { wallet: houseWallet } = await ensureHouseWallet(tx, input.currency);
      const resolved = input.lines.map((line, index) => {
        const wallet = line.owner === "house" ? houseWallet : playerWallet;
        const account = wallet.accounts.find((item) => item.type === line.accountType);
        if (!account) {
          throw new LedgerError("NOT_FOUND", `Missing ${line.owner} ${line.accountType} account`);
        }
        return { line, amount: amounts[index], account };
      });
      const lockIds = [...new Set(resolved.map((item) => item.account.id))].sort();
      for (const id of lockIds) {
        await lockAccount(tx, id);
      }
      const fresh = await tx.walletAccount.findMany({
        where: { id: { in: lockIds } }
      });
      const byId = new Map(fresh.map((account) => [account.id, account]));
      for (const item of resolved) {
        const account = byId.get(item.account.id);
        if (!account) {
          throw new LedgerError("NOT_FOUND", "Account disappeared under lock");
        }
        const next = item.line.direction === "CREDIT" ? account.cachedBalance.add(item.amount) : account.cachedBalance.sub(item.amount);
        if (item.line.owner === "player" && next.lt(0)) {
          throw new LedgerError("INSUFFICIENT_FUNDS", "Available balance is too low");
        }
        const updated = await tx.walletAccount.update({
          where: { id: account.id },
          data: { cachedBalance: next, version: { increment: 1 } }
        });
        byId.set(account.id, updated);
      }
      const journal = await tx.ledgerJournal.create({
        data: {
          userId: input.userId,
          type: input.type,
          status: "POSTED",
          currency: input.currency,
          idempotencyKey: input.idempotencyKey,
          referenceType: input.referenceType,
          referenceId: input.referenceId,
          memo: input.memo,
          metadata: input.metadata,
          postedAt: /* @__PURE__ */ new Date(),
          lines: {
            create: resolved.map((item) => ({
              accountId: item.account.id,
              direction: item.line.direction,
              amount: item.amount
            }))
          },
          transaction: {
            create: {
              userId: input.userId,
              type: input.type === "TRANSFER" ? "ADJUSTMENT" : input.type,
              status: "COMPLETED",
              currency: input.currency,
              amount: dec(input.amount),
              idempotencyKey: `tx:${input.idempotencyKey}`,
              completedAt: /* @__PURE__ */ new Date()
            }
          }
        },
        include: { lines: true, transaction: true }
      });
      return { journal, reused: false };
    });
  } catch (error) {
    if (error instanceof LedgerError) {
      throw error;
    }
    const code = error.code;
    if (code === "P2002") {
      const journal = await db.ledgerJournal.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
        include: { lines: true, transaction: true }
      });
      if (journal) {
        return { journal, reused: true };
      }
    }
    throw error;
  }
}
async function creditDemo(db, userId, currency, amount, idempotencyKey) {
  return postJournal(db, {
    userId,
    type: "BONUS",
    currency,
    idempotencyKey,
    amount,
    memo: "Demo credits. Not real money.",
    lines: [
      { owner: "house", accountType: "AVAILABLE", direction: "DEBIT", amount },
      { owner: "player", accountType: "AVAILABLE", direction: "CREDIT", amount }
    ]
  });
}
async function processDeposit(db, input) {
  const amount = dec(input.amount);
  if (amount.lte(0)) {
    throw new LedgerError("INVALID_AMOUNT", "Deposit amount must be greater than zero");
  }
  const { journal } = await postJournal(db, {
    userId: input.userId,
    type: "DEPOSIT",
    currency: input.currency,
    idempotencyKey: `journal:${input.idempotencyKey}`,
    amount,
    memo: `Deposit via ${input.method} (${input.currency})`,
    lines: [
      { owner: "house", accountType: "AVAILABLE", direction: "DEBIT", amount },
      { owner: "player", accountType: "AVAILABLE", direction: "CREDIT", amount }
    ]
  });
  const deposit = await db.deposit.create({
    data: {
      userId: input.userId,
      providerId: input.providerId,
      method: input.method,
      status: "COMPLETED",
      currency: input.currency,
      amount,
      idempotencyKey: input.idempotencyKey,
      completedAt: /* @__PURE__ */ new Date()
    },
    include: { provider: true }
  });
  return { deposit, journal };
}
async function requestWithdrawal(db, input) {
  const amount = dec(input.amount);
  if (amount.lte(0)) {
    throw new LedgerError("INVALID_AMOUNT", "Withdrawal amount must be greater than zero");
  }
  const available = await getAvailableBalance(db, input.userId, input.currency);
  if (new Prisma.Decimal(available).lt(amount)) {
    throw new LedgerError("INSUFFICIENT_FUNDS", "Insufficient available balance for withdrawal");
  }
  const { journal } = await postJournal(db, {
    userId: input.userId,
    type: "TRANSFER",
    currency: input.currency,
    idempotencyKey: `reserve-withdrawal:${input.idempotencyKey}`,
    amount,
    memo: `Withdrawal reserved (${input.method})`,
    lines: [
      { owner: "player", accountType: "AVAILABLE", direction: "DEBIT", amount },
      { owner: "player", accountType: "PENDING", direction: "CREDIT", amount }
    ]
  });
  const withdrawal = await db.withdrawal.create({
    data: {
      userId: input.userId,
      providerId: input.providerId,
      method: input.method,
      status: "REQUESTED",
      currency: input.currency,
      amount,
      idempotencyKey: input.idempotencyKey
    },
    include: { provider: true }
  });
  return { withdrawal, journal };
}
async function adminApproveWithdrawal(db, withdrawalId, adminUserId, reviewNote) {
  const withdrawal = await db.withdrawal.findUnique({
    where: { id: withdrawalId },
    include: { user: true }
  });
  if (!withdrawal || withdrawal.status !== "REQUESTED") {
    throw new LedgerError("NOT_FOUND", "Withdrawal is not pending review");
  }
  await postJournal(db, {
    userId: withdrawal.userId,
    type: "WITHDRAWAL",
    currency: withdrawal.currency,
    idempotencyKey: `settle-withdrawal:${withdrawal.id}:${Date.now()}`,
    amount: withdrawal.amount,
    memo: `Withdrawal approved & completed: ${withdrawal.id}`,
    lines: [
      { owner: "player", accountType: "PENDING", direction: "DEBIT", amount: withdrawal.amount },
      { owner: "house", accountType: "AVAILABLE", direction: "CREDIT", amount: withdrawal.amount }
    ]
  });
  const updated = await db.withdrawal.update({
    where: { id: withdrawalId },
    data: {
      status: "COMPLETED",
      reviewedById: adminUserId,
      reviewedAt: /* @__PURE__ */ new Date(),
      completedAt: /* @__PURE__ */ new Date(),
      reviewNote
    },
    include: { user: true, provider: true }
  });
  await db.auditLog.create({
    data: {
      actorType: "ADMIN",
      adminId: adminUserId,
      subjectId: withdrawal.userId,
      action: "WITHDRAWAL_APPROVED",
      entity: "Withdrawal",
      entityId: withdrawal.id,
      payload: { amount: withdrawal.amount.toFixed(8), currency: withdrawal.currency, reviewNote }
    }
  });
  return updated;
}
async function adminRejectWithdrawal(db, withdrawalId, adminUserId, reason) {
  const withdrawal = await db.withdrawal.findUnique({
    where: { id: withdrawalId },
    include: { user: true }
  });
  if (!withdrawal || withdrawal.status !== "REQUESTED") {
    throw new LedgerError("NOT_FOUND", "Withdrawal is not pending review");
  }
  await postJournal(db, {
    userId: withdrawal.userId,
    type: "REFUND",
    currency: withdrawal.currency,
    idempotencyKey: `reject-withdrawal-refund:${withdrawal.id}:${Date.now()}`,
    amount: withdrawal.amount,
    memo: `Withdrawal rejected & refunded: ${reason}`,
    lines: [
      { owner: "player", accountType: "PENDING", direction: "DEBIT", amount: withdrawal.amount },
      { owner: "player", accountType: "AVAILABLE", direction: "CREDIT", amount: withdrawal.amount }
    ]
  });
  const updated = await db.withdrawal.update({
    where: { id: withdrawalId },
    data: {
      status: "REJECTED",
      reviewedById: adminUserId,
      reviewedAt: /* @__PURE__ */ new Date(),
      failureReason: reason,
      reviewNote: reason
    },
    include: { user: true, provider: true }
  });
  await db.auditLog.create({
    data: {
      actorType: "ADMIN",
      adminId: adminUserId,
      subjectId: withdrawal.userId,
      action: "WITHDRAWAL_REJECTED",
      entity: "Withdrawal",
      entityId: withdrawal.id,
      payload: { amount: withdrawal.amount.toFixed(8), currency: withdrawal.currency, reason }
    }
  });
  return updated;
}

// ../../packages/db/dist/auth.js
import { createHash, randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
var scrypt = promisify(scryptCb);
var SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1e3;
var DEMO_CREDIT = "1000";
var AuthError = class extends Error {
  code;
  constructor(code, message) {
    super(message);
    this.code = code;
    this.name = "AuthError";
  }
};
function normalizeEmail(email) {
  return email.trim().toLowerCase();
}
function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}
async function hashPassword(password) {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, 64);
  return `scrypt:${salt.toString("hex")}:${key.toString("hex")}`;
}
async function verifyPassword(password, stored) {
  const [scheme, saltHex, keyHex] = stored.split(":");
  if (scheme !== "scrypt" || !saltHex || !keyHex) {
    return false;
  }
  const key = await scrypt(password, Buffer.from(saltHex, "hex"), 64);
  const expected = Buffer.from(keyHex, "hex");
  if (key.length !== expected.length) {
    return false;
  }
  return timingSafeEqual(key, expected);
}
function ageOn(dateOfBirth, now = /* @__PURE__ */ new Date()) {
  let age = now.getUTCFullYear() - dateOfBirth.getUTCFullYear();
  const month = now.getUTCMonth() - dateOfBirth.getUTCMonth();
  if (month < 0 || month === 0 && now.getUTCDate() < dateOfBirth.getUTCDate()) {
    age -= 1;
  }
  return age;
}
async function minAgeFor(db, country) {
  const jurisdiction = await db.jurisdiction.findUnique({ where: { country } });
  return jurisdiction?.minAge ?? 18;
}
function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    country: user.country,
    currency: user.currency,
    status: user.status,
    kycStatus: user.kycStatus,
    realMoneyEligible: user.realMoneyEligible
  };
}
async function createSession(db, userId, meta) {
  const sessionToken = randomBytes(32).toString("hex");
  await db.session.create({
    data: {
      userId,
      tokenHash: hashToken(sessionToken),
      ip: meta?.ip,
      userAgent: meta?.userAgent,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS)
    }
  });
  return sessionToken;
}
async function registerPlayer(db, input) {
  if (!input.termsAccepted || !input.privacyAccepted || !input.rgAcknowledged) {
    throw new AuthError("TERMS_REQUIRED", "Terms, privacy and responsible-gaming acknowledgement are required");
  }
  if (input.password.length < 10) {
    throw new AuthError("WEAK_PASSWORD", "Password must be at least 10 characters");
  }
  const email = normalizeEmail(input.email);
  const dateOfBirth = /* @__PURE__ */ new Date(`${input.dateOfBirth}T00:00:00.000Z`);
  if (Number.isNaN(dateOfBirth.getTime())) {
    throw new AuthError("UNDERAGE", "Date of birth is invalid");
  }
  const minAge = await minAgeFor(db, input.country);
  if (ageOn(dateOfBirth) < minAge) {
    throw new AuthError("UNDERAGE", `Minimum age is ${minAge}`);
  }
  const now = /* @__PURE__ */ new Date();
  const passwordHash = await hashPassword(input.password);
  let user;
  try {
    user = await db.user.create({
      data: {
        email,
        phone: input.phone?.trim() || null,
        passwordHash,
        country: input.country,
        currency: input.currency,
        dateOfBirth,
        promoCode: input.promoCode,
        termsAcceptedAt: now,
        privacyAcceptedAt: now,
        rgAcknowledgedAt: now,
        registrationIp: input.ip,
        registrationCountry: input.country,
        status: "ACTIVE",
        realMoneyEligible: false,
        profile: {
          create: {
            firstName: input.firstName.trim(),
            lastName: input.lastName.trim()
          }
        },
        consents: {
          create: [
            { kind: "terms", granted: true, version: "v1", ip: input.ip },
            { kind: "privacy", granted: true, version: "v1", ip: input.ip },
            { kind: "responsible_gaming", granted: true, version: "v1", ip: input.ip }
          ]
        }
      }
    });
  } catch (error) {
    const code = error.code;
    const target = error.meta?.target ?? [];
    if (code === "P2002" && target.includes("phone")) {
      throw new AuthError("PHONE_TAKEN", "Phone already registered");
    }
    if (code === "P2002") {
      throw new AuthError("EMAIL_TAKEN", "Email already registered");
    }
    throw error;
  }
  await ensurePlayerWallets(db, user.id, user.currency);
  await creditDemo(db, user.id, user.currency, DEMO_CREDIT, `welcome-demo:${user.id}`);
  const bronze = await db.vipLevel.findUnique({ where: { slug: "bronze" } });
  if (bronze) {
    await db.vipProgress.create({
      data: { userId: user.id, levelId: bronze.id }
    });
  }
  const welcome = await db.bonusTemplate.findUnique({ where: { slug: "welcome-demo" } });
  if (welcome) {
    await db.playerBonus.create({
      data: {
        userId: user.id,
        templateId: welcome.id,
        status: "COMPLETED",
        awarded: DEMO_CREDIT,
        activatedAt: now
      }
    });
  }
  const sessionToken = await createSession(db, user.id, input);
  return { user: publicUser(user), sessionToken };
}
async function loginPlayer(db, input) {
  const email = normalizeEmail(input.email);
  const user = await db.user.findUnique({ where: { email } });
  const ok = user ? await verifyPassword(input.password, user.passwordHash) : false;
  if (!user || !ok) {
    if (user) {
      await db.loginEvent.create({
        data: { userId: user.id, success: false, ip: input.ip, userAgent: input.userAgent, reason: "bad_password" }
      });
    }
    throw new AuthError("INVALID_CREDENTIALS", "Invalid email or password");
  }
  if (["LOCKED", "CLOSED", "SUSPENDED", "SELF_EXCLUDED"].includes(user.status)) {
    await db.loginEvent.create({
      data: { userId: user.id, success: false, ip: input.ip, userAgent: input.userAgent, reason: user.status }
    });
    throw new AuthError("ACCOUNT_BLOCKED", "Account cannot sign in");
  }
  await db.user.update({
    where: { id: user.id },
    data: { lastLoginAt: /* @__PURE__ */ new Date() }
  });
  await db.loginEvent.create({
    data: { userId: user.id, success: true, ip: input.ip, userAgent: input.userAgent }
  });
  const sessionToken = await createSession(db, user.id, input);
  return { user: publicUser(user), sessionToken };
}
async function getSessionUser(db, sessionToken) {
  if (!sessionToken) {
    return null;
  }
  const session = await db.session.findUnique({
    where: { tokenHash: hashToken(sessionToken) },
    include: { user: true }
  });
  if (!session || session.revokedAt || session.expiresAt.getTime() <= Date.now()) {
    return null;
  }
  await db.session.update({
    where: { id: session.id },
    data: { lastSeenAt: /* @__PURE__ */ new Date() }
  });
  return publicUser(session.user);
}
async function revokeSession(db, sessionToken) {
  if (!sessionToken) {
    return;
  }
  await db.session.updateMany({
    where: { tokenHash: hashToken(sessionToken), revokedAt: null },
    data: { revokedAt: /* @__PURE__ */ new Date() }
  });
}
async function getUserSessions(db, userId, currentSessionToken) {
  const currentHash = currentSessionToken ? hashToken(currentSessionToken) : null;
  const sessions = await db.session.findMany({
    where: { userId, revokedAt: null, expiresAt: { gt: /* @__PURE__ */ new Date() } },
    orderBy: { lastSeenAt: "desc" }
  });
  return sessions.map((s) => ({
    id: s.id,
    ip: s.ip ?? "Unknown IP",
    userAgent: s.userAgent ?? "Unknown Browser / Device",
    lastSeenAt: s.lastSeenAt.toISOString(),
    createdAt: s.createdAt.toISOString(),
    isCurrent: currentHash ? s.tokenHash === currentHash : false
  }));
}
async function revokeOtherSessions(db, userId, currentSessionToken) {
  const currentHash = hashToken(currentSessionToken);
  return db.session.updateMany({
    where: {
      userId,
      tokenHash: { not: currentHash },
      revokedAt: null
    },
    data: { revokedAt: /* @__PURE__ */ new Date() }
  });
}
async function changePassword(db, userId, oldPass, newPass) {
  if (newPass.length < 10) {
    throw new AuthError("WEAK_PASSWORD", "New password must be at least 10 characters");
  }
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
  const ok = await verifyPassword(oldPass, user.passwordHash);
  if (!ok) {
    throw new AuthError("INVALID_CREDENTIALS", "Current password is incorrect");
  }
  const newHash = await hashPassword(newPass);
  await db.user.update({
    where: { id: userId },
    data: { passwordHash: newHash }
  });
  await db.auditLog.create({
    data: {
      actorType: "PLAYER",
      subjectId: userId,
      action: "PASSWORD_CHANGED",
      entity: "User",
      entityId: userId
    }
  });
  return { ok: true };
}
async function updateUserProfile(db, userId, data) {
  const profile = await db.profile.upsert({
    where: { userId },
    create: {
      userId,
      firstName: data.firstName ?? "Player",
      lastName: data.lastName ?? "",
      address1: data.address1,
      city: data.city,
      postalCode: data.postalCode
    },
    update: {
      firstName: data.firstName,
      lastName: data.lastName,
      address1: data.address1,
      city: data.city,
      postalCode: data.postalCode
    }
  });
  return profile;
}

// ../../packages/db/dist/play.js
import { randomBytes as randomBytes2, randomUUID } from "node:crypto";
import { Prisma as Prisma4 } from "@prisma/client";

// ../../packages/db/dist/rg.js
import { Prisma as Prisma2 } from "@prisma/client";
var RgError = class extends Error {
  code;
  constructor(code, message) {
    super(message);
    this.code = code;
    this.name = "RgError";
  }
};
async function checkPlayerEligibleToPlay(db, userId) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { status: true, selfExcludedUntil: true }
  });
  if (!user)
    return;
  if (user.status === "SELF_EXCLUDED") {
    if (user.selfExcludedUntil && user.selfExcludedUntil.getTime() <= Date.now()) {
      await db.user.update({
        where: { id: userId },
        data: { status: "ACTIVE", selfExcludedUntil: null }
      });
    } else {
      throw new RgError("SELF_EXCLUDED", "Account is currently self-excluded under responsible gaming policy");
    }
  }
  if (user.status === "LOCKED" || user.status === "SUSPENDED" || user.status === "CLOSED") {
    throw new RgError("SELF_EXCLUDED", `Account status is ${user.status}`);
  }
}
async function checkWagerLimit(db, userId, betAmount) {
  const bet = new Prisma2.Decimal(betAmount);
  const now = /* @__PURE__ */ new Date();
  const limits = await db.responsibleGamingLimit.findMany({
    where: {
      userId,
      type: "WAGER",
      active: true,
      startsAt: { lte: now },
      OR: [{ endsAt: null }, { endsAt: { gte: now } }]
    }
  });
  for (const limit of limits) {
    if (!limit.amount)
      continue;
    const since = new Date(now.getTime() - limit.periodHours * 60 * 60 * 1e3);
    const aggregate = await db.gameRound.aggregate({
      where: {
        userId,
        createdAt: { gte: since }
      },
      _sum: { betAmount: true }
    });
    const currentWagered = aggregate._sum.betAmount ?? new Prisma2.Decimal(0);
    if (currentWagered.add(bet).gt(limit.amount)) {
      throw new RgError("WAGER_LIMIT_EXCEEDED", `Wager limit of ${limit.amount.toString()} for ${limit.periodHours}h would be exceeded. Current total: ${currentWagered.toString()}`);
    }
  }
}
async function setResponsibleGamingLimit(db, input) {
  const now = /* @__PURE__ */ new Date();
  const amount = input.amount ? new Prisma2.Decimal(input.amount) : null;
  await db.responsibleGamingLimit.updateMany({
    where: {
      userId: input.userId,
      type: input.type,
      periodHours: input.periodHours,
      active: true
    },
    data: { active: false, endsAt: now }
  });
  return db.responsibleGamingLimit.create({
    data: {
      userId: input.userId,
      type: input.type,
      amount,
      minutes: input.minutes,
      periodHours: input.periodHours,
      active: true,
      startsAt: now
    }
  });
}
async function applyCoolingOff(db, input) {
  const now = /* @__PURE__ */ new Date();
  const until = new Date(now.getTime() + input.hours * 60 * 60 * 1e3);
  await db.selfExclusion.create({
    data: {
      userId: input.userId,
      reason: input.reason ?? `Cooling-off for ${input.hours} hours`,
      startsAt: now,
      endsAt: until,
      permanent: false
    }
  });
  await db.user.update({
    where: { id: input.userId },
    data: {
      status: "SELF_EXCLUDED",
      selfExcludedUntil: until
    }
  });
  await db.session.updateMany({
    where: { userId: input.userId, revokedAt: null },
    data: { revokedAt: now }
  });
  return { ok: true, until };
}
async function applySelfExclusion(db, input) {
  const now = /* @__PURE__ */ new Date();
  let until = null;
  if (!input.permanent && input.months) {
    until = new Date(now);
    until.setMonth(until.getMonth() + input.months);
  }
  await db.selfExclusion.create({
    data: {
      userId: input.userId,
      reason: input.reason ?? (input.permanent ? "Permanent self-exclusion" : `Self-exclusion for ${input.months} months`),
      startsAt: now,
      endsAt: until,
      permanent: !!input.permanent
    }
  });
  await db.user.update({
    where: { id: input.userId },
    data: {
      status: "SELF_EXCLUDED",
      selfExcludedUntil: until
    }
  });
  await db.session.updateMany({
    where: { userId: input.userId, revokedAt: null },
    data: { revokedAt: now }
  });
  return { ok: true, permanent: !!input.permanent, until };
}
async function getPlayerRgSummary(db, userId) {
  const now = /* @__PURE__ */ new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1e3);
  const [limits, user, rounds24h, deposits24h] = await Promise.all([
    db.responsibleGamingLimit.findMany({
      where: {
        userId,
        active: true,
        startsAt: { lte: now },
        OR: [{ endsAt: null }, { endsAt: { gte: now } }]
      }
    }),
    db.user.findUnique({
      where: { id: userId },
      select: { status: true, selfExcludedUntil: true }
    }),
    db.gameRound.aggregate({
      where: { userId, createdAt: { gte: dayAgo } },
      _sum: { betAmount: true, winAmount: true },
      _count: { id: true }
    }),
    db.deposit.aggregate({
      where: { userId, status: "COMPLETED", createdAt: { gte: dayAgo } },
      _sum: { amount: true },
      _count: { id: true }
    })
  ]);
  const totalBet24h = rounds24h._sum.betAmount ?? new Prisma2.Decimal(0);
  const totalWin24h = rounds24h._sum.winAmount ?? new Prisma2.Decimal(0);
  const netLoss24h = totalBet24h.sub(totalWin24h);
  return {
    limits: limits.map((limit) => ({
      id: limit.id,
      type: limit.type,
      amount: limit.amount ? limit.amount.toFixed(8) : null,
      minutes: limit.minutes,
      periodHours: limit.periodHours,
      active: limit.active,
      startsAt: limit.startsAt.toISOString(),
      endsAt: limit.endsAt?.toISOString() ?? null
    })),
    selfExclusion: user?.status === "SELF_EXCLUDED" ? {
      active: true,
      endsAt: user.selfExcludedUntil?.toISOString() ?? null,
      permanent: user.selfExcludedUntil === null
    } : null,
    activityStats: {
      sessionTimeMinutes: 45,
      // Demo activity simulation
      totalWagered24h: totalBet24h.toFixed(2),
      netLoss24h: (netLoss24h.gt(0) ? netLoss24h : new Prisma2.Decimal(0)).toFixed(2),
      depositCount24h: deposits24h._count.id,
      depositTotal24h: (deposits24h._sum.amount ?? new Prisma2.Decimal(0)).toFixed(2),
      totalRounds24h: rounds24h._count.id
    }
  };
}

// ../../packages/db/dist/bonuses.js
import { Prisma as Prisma3 } from "@prisma/client";
var BonusError = class extends Error {
  code;
  constructor(code, message) {
    super(message);
    this.code = code;
    this.name = "BonusError";
  }
};
async function claimBonusTemplate(db, userId, templateSlug) {
  const user = await db.user.findUniqueOrThrow({
    where: { id: userId },
    include: { wallets: { include: { accounts: true } } }
  });
  const template = await db.bonusTemplate.findUnique({
    where: { slug: templateSlug }
  });
  if (!template || !template.active) {
    throw new BonusError("BONUS_NOT_FOUND", "Bonus is not available");
  }
  if (template.type === "WELCOME") {
    const existing = await db.playerBonus.findFirst({
      where: { userId, templateId: template.id }
    });
    if (existing) {
      throw new BonusError("ALREADY_ACTIVE", "Welcome bonus has already been claimed");
    }
  }
  const bonusAmount = template.amount ?? new Prisma3.Decimal(100);
  const wageringMultiplier = template.wageringMultiplier || 30;
  const wageringRequired = bonusAmount.mul(wageringMultiplier);
  const now = /* @__PURE__ */ new Date();
  const expiresAt = template.expiresInHours ? new Date(now.getTime() + template.expiresInHours * 60 * 60 * 1e3) : null;
  await postJournal(db, {
    userId,
    type: "BONUS",
    currency: user.currency,
    idempotencyKey: `bonus:${template.slug}:${userId}:${Date.now()}`,
    amount: bonusAmount,
    memo: `Bonus credited: ${template.name}`,
    lines: [
      { owner: "house", accountType: "AVAILABLE", direction: "DEBIT", amount: bonusAmount },
      { owner: "player", accountType: "BONUS", direction: "CREDIT", amount: bonusAmount }
    ]
  });
  const playerWallet = user.wallets.find((w) => w.currency === user.currency);
  const bonusAccount = playerWallet?.accounts.find((a) => a.type === "BONUS");
  if (!bonusAccount) {
    throw new Error("Bonus account not found");
  }
  const playerBonus = await db.playerBonus.create({
    data: {
      userId,
      templateId: template.id,
      status: "ACTIVATED",
      awarded: bonusAmount,
      activatedAt: now,
      expiresAt,
      bonusWallet: {
        create: {
          accountId: bonusAccount.id,
          remaining: bonusAmount,
          wagered: new Prisma3.Decimal(0),
          wageringRequired
        }
      }
    },
    include: { template: true, bonusWallet: true }
  });
  return playerBonus;
}
async function redeemPromoCode(db, userId, codeStr) {
  const code = await db.promoCode.findUnique({
    where: { code: codeStr.toUpperCase().trim() },
    include: { promotion: true }
  });
  if (!code || !code.active) {
    throw new BonusError("PROMO_CODE_INVALID", "Promo code is invalid or expired");
  }
  if (code.maxRedemptions && code.redeemed >= code.maxRedemptions) {
    throw new BonusError("PROMO_CODE_INVALID", "Promo code has reached maximum redemptions");
  }
  await db.promoCode.update({
    where: { id: code.id },
    data: { redeemed: { increment: 1 } }
  });
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
  const rewardAmount = new Prisma3.Decimal(50);
  await postJournal(db, {
    userId,
    type: "BONUS",
    currency: user.currency,
    idempotencyKey: `promo:${code.id}:${userId}:${Date.now()}`,
    amount: rewardAmount,
    memo: `Promo Code Reward: ${code.code}`,
    lines: [
      { owner: "house", accountType: "AVAILABLE", direction: "DEBIT", amount: rewardAmount },
      { owner: "player", accountType: "AVAILABLE", direction: "CREDIT", amount: rewardAmount }
    ]
  });
  return { code: code.code, reward: rewardAmount.toFixed(2), title: code.promotion.title };
}
async function processBonusWagering(db, userId, betAmount) {
  const activeBonus = await db.playerBonus.findFirst({
    where: {
      userId,
      status: "ACTIVATED",
      bonusWallet: { isNot: null }
    },
    include: { bonusWallet: true, user: true }
  });
  if (!activeBonus || !activeBonus.bonusWallet)
    return;
  const bw = activeBonus.bonusWallet;
  const newWagered = bw.wagered.add(betAmount);
  if (newWagered.gte(bw.wageringRequired)) {
    await db.bonusWallet.update({
      where: { id: bw.id },
      data: { wagered: bw.wageringRequired }
    });
    await db.playerBonus.update({
      where: { id: activeBonus.id },
      data: { status: "COMPLETED" }
    });
    if (bw.remaining.gt(0)) {
      await postJournal(db, {
        userId,
        type: "TRANSFER",
        currency: activeBonus.user.currency,
        idempotencyKey: `bonus-complete:${activeBonus.id}:${Date.now()}`,
        amount: bw.remaining,
        memo: "Bonus wagering completed, funds converted to cash",
        lines: [
          { owner: "player", accountType: "BONUS", direction: "DEBIT", amount: bw.remaining },
          { owner: "player", accountType: "AVAILABLE", direction: "CREDIT", amount: bw.remaining }
        ]
      });
    }
  } else {
    await db.bonusWallet.update({
      where: { id: bw.id },
      data: { wagered: newWagered }
    });
  }
}
async function recordVipWager(db, userId, betAmount) {
  let progress = await db.vipProgress.findUnique({
    where: { userId },
    include: { level: true }
  });
  if (!progress) {
    const bronze = await db.vipLevel.findUnique({ where: { slug: "bronze" } });
    if (!bronze)
      return;
    progress = await db.vipProgress.create({
      data: { userId, levelId: bronze.id },
      include: { level: true }
    });
  }
  const addedPoints = betAmount.mul(1);
  const newPoints = progress.points.add(addedPoints);
  const newLifetimeWager = progress.lifetimeWager.add(betAmount);
  const nextLevels = await db.vipLevel.findMany({
    where: { pointsRequired: { lte: newPoints } },
    orderBy: { rank: "desc" },
    take: 1
  });
  const bestLevel = nextLevels[0] ?? progress.level;
  await db.vipProgress.update({
    where: { userId },
    data: {
      points: newPoints,
      lifetimeWager: newLifetimeWager,
      levelId: bestLevel.id
    }
  });
}
async function claimVipCashback(db, userId) {
  const progress = await db.vipProgress.findUnique({
    where: { userId },
    include: { level: true, user: true }
  });
  if (!progress || progress.level.cashbackBps <= 0) {
    throw new BonusError("NOT_ELIGIBLE", "No VIP cashback currently available for your tier");
  }
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1e3);
  const aggregate = await db.gameRound.aggregate({
    where: { userId, createdAt: { gte: since } },
    _sum: { betAmount: true, winAmount: true }
  });
  const totalBets = aggregate._sum.betAmount ?? new Prisma3.Decimal(0);
  const totalWins = aggregate._sum.winAmount ?? new Prisma3.Decimal(0);
  const netLoss = totalBets.sub(totalWins);
  if (netLoss.lte(0)) {
    throw new BonusError("NOT_ELIGIBLE", "No net loss in the period to calculate cashback on");
  }
  const rate = new Prisma3.Decimal(progress.level.cashbackBps).div(1e4);
  const cashbackAmount = netLoss.mul(rate).toDecimalPlaces(2, Prisma3.Decimal.ROUND_HALF_UP);
  if (cashbackAmount.lte(0)) {
    throw new BonusError("NOT_ELIGIBLE", "Calculated cashback amount is 0");
  }
  await postJournal(db, {
    userId,
    type: "BONUS",
    currency: progress.user.currency,
    idempotencyKey: `vip-cashback:${userId}:${Date.now()}`,
    amount: cashbackAmount,
    memo: `VIP ${progress.level.name} Cashback (${(progress.level.cashbackBps / 100).toFixed(1)}%)`,
    lines: [
      { owner: "house", accountType: "AVAILABLE", direction: "DEBIT", amount: cashbackAmount },
      { owner: "player", accountType: "AVAILABLE", direction: "CREDIT", amount: cashbackAmount }
    ]
  });
  return { amount: cashbackAmount.toFixed(2), tier: progress.level.name };
}

// ../../packages/db/dist/play.js
var PlayError = class extends Error {
  code;
  constructor(code, message) {
    super(message);
    this.code = code;
    this.name = "PlayError";
  }
};
function money2(value) {
  return value.toFixed(8);
}
function generateProvablyFair(serverSeed, clientSeed, nonce) {
  const { createHmac, createHash: createHash3 } = __require("node:crypto");
  const serverSeedHash = createHash3("sha256").update(serverSeed).digest("hex");
  const hmac = createHmac("sha256", serverSeed).update(`${clientSeed}:${nonce}`).digest("hex");
  const intVal = parseInt(hmac.substring(0, 8), 16);
  const floatVal = intVal / 4294967296;
  return { serverSeedHash, floatVal, hmac };
}
var SLOT_SYMBOLS = ["\u{1F352}", "\u{1F34B}", "\u{1F347}", "\u{1F514}", "\u2B50", "\u{1F48E}", "7\uFE0F\u20E3", "\u{1F451}"];
var PAYTABLE = {
  "\u{1F451}": 50,
  "7\uFE0F\u20E3": 25,
  "\u{1F48E}": 15,
  "\u2B50": 10,
  "\u{1F514}": 5,
  "\u{1F347}": 3,
  "\u{1F34B}": 2,
  "\u{1F352}": 1.5
};
function simulateSlots(randFloat) {
  const reels = [];
  for (let r = 0; r < 5; r++) {
    const reel = [];
    for (let row = 0; row < 3; row++) {
      const idx = Math.floor((randFloat * 1e3 + r * 13 + row * 7) % SLOT_SYMBOLS.length);
      reel.push(SLOT_SYMBOLS[idx]);
    }
    reels.push(reel);
  }
  const middle = reels.map((col) => col[1]);
  let matches = 1;
  const firstSym = middle[0];
  for (let i = 1; i < 5; i++) {
    if (middle[i] === firstSym || middle[i] === "\u{1F451}") {
      matches++;
    } else {
      break;
    }
  }
  let multiplier = 0;
  if (matches >= 3) {
    multiplier = (PAYTABLE[firstSym] || 2) * (matches === 5 ? 5 : matches === 4 ? 2 : 1);
  } else if (randFloat < 0.35) {
    multiplier = 1.5;
  }
  return {
    reels,
    multiplier,
    won: multiplier > 0,
    freeSpinsWon: matches === 5 ? 10 : 0
  };
}
function simulateRoulette(betDetails, randFloat) {
  const winningNumber = Math.floor(randFloat * 37);
  const isRed = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36].includes(winningNumber);
  const isBlack = winningNumber !== 0 && !isRed;
  const isEven = winningNumber !== 0 && winningNumber % 2 === 0;
  const betType = betDetails?.betType ?? "RED";
  const selectedNumber = betDetails?.number;
  let multiplier = 0;
  if (betType === "STRAIGHT" && selectedNumber === winningNumber) {
    multiplier = 36;
  } else if (betType === "RED" && isRed) {
    multiplier = 2;
  } else if (betType === "BLACK" && isBlack) {
    multiplier = 2;
  } else if (betType === "EVEN" && isEven) {
    multiplier = 2;
  } else if (betType === "ODD" && !isEven && winningNumber !== 0) {
    multiplier = 2;
  }
  return {
    winningNumber,
    color: winningNumber === 0 ? "GREEN" : isRed ? "RED" : "BLACK",
    multiplier,
    won: multiplier > 0
  };
}
function simulateBlackjack(randFloat) {
  const ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
  const getCard = (seedOffset) => {
    const idx = Math.floor((randFloat * 1e3 + seedOffset) % ranks.length);
    return ranks[idx];
  };
  const playerCards = [getCard(1), getCard(2)];
  const dealerCards = [getCard(3), getCard(4)];
  const won = randFloat < 0.48;
  const isBlackjack = won && randFloat < 0.05;
  const multiplier = isBlackjack ? 2.5 : won ? 2 : 0;
  return {
    playerCards,
    dealerCards,
    isBlackjack,
    multiplier,
    won
  };
}
function simulateCrash(gameData, serverSeed, clientSeed, nonce) {
  const { createHmac } = __require("node:crypto");
  const hash = createHmac("sha256", serverSeed).update(`${clientSeed}:${nonce}`).digest("hex");
  const intVal = parseInt(hash.substring(0, 8), 16);
  const randFloat = intVal / 4294967296;
  let crashPoint = 1;
  if (randFloat >= 0.01) {
    crashPoint = Math.max(1, Math.floor(99 / (100 - randFloat * 99) * 100) / 100);
  }
  const targetMultiplier = typeof gameData?.targetMultiplier === "number" ? gameData.targetMultiplier : 1.5;
  const won = targetMultiplier <= crashPoint;
  const multiplier = won ? targetMultiplier : 0;
  return {
    crashPoint,
    cashedOutAt: targetMultiplier,
    multiplier,
    won
  };
}
var PLINKO_PAYOUT_TABLE = {
  8: {
    LOW: [5.6, 2.1, 1.1, 1, 0.5, 1, 1.1, 2.1, 5.6],
    MEDIUM: [13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13],
    HIGH: [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29]
  },
  9: {
    LOW: [5.6, 2, 1.6, 1, 0.7, 0.7, 1, 1.6, 2, 5.6],
    MEDIUM: [18, 4, 1.7, 0.9, 0.5, 0.5, 0.9, 1.7, 4, 18],
    HIGH: [43, 7, 2, 0.6, 0.2, 0.2, 0.6, 2, 7, 43]
  },
  10: {
    LOW: [8.9, 3, 1.4, 1.1, 1, 0.5, 1, 1.1, 1.4, 3, 8.9],
    MEDIUM: [22, 5, 2, 1.4, 0.6, 0.4, 0.6, 1.4, 2, 5, 22],
    HIGH: [76, 10, 3, 0.9, 0.3, 0.2, 0.3, 0.9, 3, 10, 76]
  },
  11: {
    LOW: [8.4, 3, 1.9, 1.3, 1, 0.7, 0.7, 1, 1.3, 1.9, 3, 8.4],
    MEDIUM: [24, 6, 3, 1.8, 0.7, 0.5, 0.5, 0.7, 1.8, 3, 6, 24],
    HIGH: [120, 14, 4.2, 1.4, 0.4, 0.2, 0.2, 0.4, 1.4, 4.2, 14, 120]
  },
  12: {
    LOW: [10, 3, 1.6, 1.4, 1.1, 1, 0.5, 1, 1.1, 1.4, 1.6, 3, 10],
    MEDIUM: [33, 11, 4, 2, 1.1, 0.6, 0.3, 0.6, 1.1, 2, 4, 11, 33],
    HIGH: [170, 24, 8.1, 2, 0.7, 0.2, 0.2, 0.2, 0.7, 2, 8.1, 24, 170]
  },
  13: {
    LOW: [8.1, 4, 2.5, 1.8, 1.4, 1, 0.7, 0.7, 1, 1.4, 1.8, 2.5, 4, 8.1],
    MEDIUM: [43, 13, 6, 3, 1.3, 0.7, 0.4, 0.4, 0.7, 1.3, 3, 6, 13, 43],
    HIGH: [260, 37, 11, 4, 1, 0.2, 0.2, 0.2, 0.2, 1, 4, 11, 37, 260]
  },
  14: {
    LOW: [7.1, 4, 1.9, 1.4, 1.3, 1.1, 1, 0.5, 1, 1.1, 1.3, 1.4, 1.9, 4, 7.1],
    MEDIUM: [58, 15, 7, 4, 1.9, 1, 0.5, 0.2, 0.5, 1, 1.9, 4, 7, 15, 58],
    HIGH: [420, 56, 18, 5, 1.9, 0.3, 0.2, 0.2, 0.2, 0.3, 1.9, 5, 18, 56, 420]
  },
  15: {
    LOW: [15, 8, 3, 2, 1.5, 1.1, 1, 0.7, 0.7, 1, 1.1, 1.5, 2, 3, 8, 15],
    MEDIUM: [88, 18, 11, 5, 3, 1.3, 0.5, 0.3, 0.3, 0.5, 1.3, 3, 5, 11, 18, 88],
    HIGH: [620, 83, 27, 8, 3, 0.5, 0.2, 0.2, 0.2, 0.2, 0.5, 3, 8, 27, 83, 620]
  },
  16: {
    LOW: [16, 9, 2, 1.4, 1.4, 1.2, 1.1, 1, 0.5, 1, 1.1, 1.2, 1.4, 1.4, 2, 9, 16],
    MEDIUM: [110, 41, 10, 5, 3, 1.5, 1, 0.5, 0.3, 0.5, 1, 1.5, 3, 5, 10, 41, 110],
    HIGH: [1e3, 130, 26, 9, 4, 2, 0.2, 0.2, 0.2, 0.2, 0.2, 2, 4, 9, 26, 130, 1e3]
  }
};
function simulatePlinko(gameData, serverSeed, clientSeed, nonce) {
  const { createHmac } = __require("node:crypto");
  const rows = typeof gameData?.rows === "number" ? Math.min(16, Math.max(8, gameData.rows)) : 16;
  const risk = ["LOW", "MEDIUM", "HIGH"].includes(gameData?.risk) ? gameData?.risk : "MEDIUM";
  const path = [];
  let rightMoves = 0;
  for (let i = 0; i < rows; i++) {
    const hash = createHmac("sha256", serverSeed).update(`${clientSeed}:${nonce}:${i}`).digest("hex");
    const val = parseInt(hash.substring(0, 8), 16) / 4294967296;
    const dir = val >= 0.5 ? 1 : 0;
    path.push(dir);
    if (dir === 1)
      rightMoves++;
  }
  const binIndex = rightMoves;
  const multipliers = PLINKO_PAYOUT_TABLE[rows]?.[risk] || PLINKO_PAYOUT_TABLE[16].MEDIUM;
  const multiplier = multipliers[binIndex] ?? 1;
  return {
    rows,
    risk,
    path,
    binIndex,
    multiplier,
    won: multiplier > 0
  };
}
function calculateMinesMult(mineCount, revealedCount) {
  if (revealedCount <= 0)
    return 1;
  const safeCount = 25 - mineCount;
  if (revealedCount > safeCount)
    return 0;
  let mult = 0.99;
  for (let i = 0; i < revealedCount; i++) {
    mult *= (25 - i) / (safeCount - i);
  }
  return Math.floor(mult * 100) / 100;
}
function simulateMines(gameData, serverSeed, clientSeed, nonce) {
  const { createHmac } = __require("node:crypto");
  const mineCount = typeof gameData?.mineCount === "number" ? Math.min(24, Math.max(1, gameData.mineCount)) : 3;
  const revealedTiles = Array.isArray(gameData?.revealedTiles) ? gameData?.revealedTiles : [];
  const totalTiles = 25;
  const tiles = Array.from({ length: totalTiles }, (_, i) => i);
  for (let i = totalTiles - 1; i > 0; i--) {
    const hash = createHmac("sha256", serverSeed).update(`${clientSeed}:${nonce}:${i}`).digest("hex");
    const float = parseInt(hash.substring(0, 8), 16) / 4294967296;
    const j = Math.floor(float * (i + 1));
    const temp = tiles[i];
    tiles[i] = tiles[j];
    tiles[j] = temp;
  }
  const minePositions = tiles.slice(0, mineCount).sort((a, b) => a - b);
  const hitMine = revealedTiles.some((tile) => minePositions.includes(tile));
  let multiplier = 0;
  let won = false;
  if (hitMine) {
    multiplier = 0;
    won = false;
  } else if (revealedTiles.length > 0) {
    multiplier = calculateMinesMult(mineCount, revealedTiles.length);
    won = multiplier > 0;
  }
  return {
    mineCount,
    revealedTiles,
    minePositions,
    hitMine,
    multiplier,
    won
  };
}
function simulateDice(gameData, randFloat) {
  const target = typeof gameData?.target === "number" ? Math.min(98, Math.max(1, gameData.target)) : 50;
  const isRollUnder = gameData?.isRollUnder !== false;
  const rolledNumber = Math.floor(randFloat * 1e4) / 100;
  const winChance = isRollUnder ? target : 100 - target;
  const clampedWinChance = Math.max(0.01, Math.min(98, winChance));
  const targetMultiplier = Math.floor(99 / clampedWinChance * 1e4) / 1e4;
  const won = isRollUnder ? rolledNumber < target : rolledNumber > target;
  const multiplier = won ? targetMultiplier : 0;
  return {
    target,
    isRollUnder,
    rolledNumber,
    winChance: clampedWinChance,
    won,
    multiplier
  };
}
function simulateLimbo(gameData, randFloat) {
  const targetMultiplier = typeof gameData?.targetMultiplier === "number" ? Math.min(1e6, Math.max(1.01, gameData.targetMultiplier)) : 2;
  let rolledMultiplier = 1;
  if (randFloat >= 0.99) {
    rolledMultiplier = Math.min(1e6, Math.floor(99 / (1 - randFloat) * 100) / 100);
  } else {
    rolledMultiplier = Math.max(1, Math.floor(99 / (100 - randFloat * 100) * 100) / 100);
  }
  const won = rolledMultiplier >= targetMultiplier;
  const multiplier = won ? targetMultiplier : 0;
  return {
    targetMultiplier,
    rolledMultiplier,
    won,
    multiplier
  };
}
function simulateHilo(gameData, randFloat) {
  const currentCardValue = typeof gameData?.currentCardValue === "number" ? gameData.currentCardValue : 7;
  const guess = gameData?.guess || "HIGHER";
  const accumulatedMultiplier = typeof gameData?.accumulatedMultiplier === "number" ? gameData.accumulatedMultiplier : 1;
  const ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
  const suits = ["\u2660", "\u2665", "\u2666", "\u2663"];
  const nextRankIdx = Math.floor(randFloat * ranks.length);
  const nextSuitIdx = Math.floor(randFloat * 1e3 % suits.length);
  const nextCard = {
    rank: ranks[nextRankIdx],
    suit: suits[nextSuitIdx],
    value: nextRankIdx + 2
  };
  const rankIdx = currentCardValue - 2;
  const higherChance = Math.max(0.0769, (13 - rankIdx) / 13);
  const lowerChance = Math.max(0.0769, (rankIdx + 1) / 13);
  const higherMult = Math.floor(0.985 / higherChance * 100) / 100;
  const lowerMult = Math.floor(0.985 / lowerChance * 100) / 100;
  let won = false;
  let multiplier = 0;
  if (guess === "CASHOUT") {
    won = true;
    multiplier = accumulatedMultiplier;
  } else if (guess === "HIGHER" && nextCard.value >= currentCardValue) {
    won = true;
    multiplier = Math.floor(accumulatedMultiplier * higherMult * 100) / 100;
  } else if (guess === "LOWER" && nextCard.value <= currentCardValue) {
    won = true;
    multiplier = Math.floor(accumulatedMultiplier * lowerMult * 100) / 100;
  } else if (guess === "SAME" && nextCard.value === currentCardValue) {
    won = true;
    multiplier = Math.floor(accumulatedMultiplier * 12.5 * 100) / 100;
  }
  return {
    currentCardValue,
    nextCard,
    guess,
    won,
    multiplier: won ? multiplier : 0,
    roundMultiplier: guess === "HIGHER" ? higherMult : guess === "LOWER" ? lowerMult : 12.5
  };
}
async function playDemoGame(db, input) {
  const bet = new Prisma4.Decimal(input.betAmount);
  if (bet.lte(0)) {
    throw new PlayError("INVALID_BET", "Bet must be greater than zero");
  }
  await checkPlayerEligibleToPlay(db, input.userId);
  await checkWagerLimit(db, input.userId, bet);
  const user = await db.user.findUniqueOrThrow({ where: { id: input.userId } });
  const game = await db.game.findUnique({
    where: { slug: input.slug },
    include: { provider: true }
  });
  if (!game || !game.active || !game.demoAvailable) {
    throw new PlayError("GAME_NOT_FOUND", "Demo game is not available");
  }
  const session = await db.gameSession.create({
    data: {
      userId: user.id,
      gameId: game.id,
      providerId: game.providerId,
      mode: "DEMO",
      status: "OPEN",
      currency: user.currency
    }
  });
  const roundId = randomUUID();
  const providerTxId = `demo:${roundId}`;
  try {
    await postJournal(db, {
      userId: user.id,
      type: "BET",
      currency: user.currency,
      idempotencyKey: `play:${roundId}:bet`,
      amount: bet,
      referenceType: "game_round",
      referenceId: roundId,
      memo: `Demo bet ${game.slug}`,
      lines: [
        { owner: "player", accountType: "AVAILABLE", direction: "DEBIT", amount: bet },
        { owner: "house", accountType: "AVAILABLE", direction: "CREDIT", amount: bet }
      ]
    });
  } catch (error) {
    await db.gameSession.update({
      where: { id: session.id },
      data: { status: "CLOSED", closedAt: /* @__PURE__ */ new Date() }
    });
    if (error instanceof LedgerError && error.code === "INSUFFICIENT_FUNDS") {
      throw new PlayError("INSUFFICIENT_FUNDS", error.message);
    }
    throw error;
  }
  const serverSeed = randomBytes2(32).toString("hex");
  const clientSeed = input.gameData?.clientSeed || randomBytes2(16).toString("hex");
  const nonce = Date.now();
  const pf = generateProvablyFair(serverSeed, clientSeed, nonce);
  let gameResult = {};
  let multiplier = 0;
  const slug = game.slug.toLowerCase();
  if (input.rollWin) {
    const won = input.rollWin();
    multiplier = won ? 2 : 0;
    gameResult = { won, multiplier };
  } else if (slug.includes("plinko")) {
    const sim = simulatePlinko(input.gameData, serverSeed, clientSeed, nonce);
    multiplier = sim.multiplier;
    gameResult = sim;
  } else if (slug.includes("mines")) {
    const sim = simulateMines(input.gameData, serverSeed, clientSeed, nonce);
    multiplier = sim.multiplier;
    gameResult = sim;
  } else if (slug.includes("dice")) {
    const sim = simulateDice(input.gameData, pf.floatVal);
    multiplier = sim.multiplier;
    gameResult = sim;
  } else if (slug.includes("limbo")) {
    const sim = simulateLimbo(input.gameData, pf.floatVal);
    multiplier = sim.multiplier;
    gameResult = sim;
  } else if (slug.includes("hilo")) {
    const sim = simulateHilo(input.gameData, pf.floatVal);
    multiplier = sim.multiplier;
    gameResult = sim;
  } else if (game.category === "SLOTS") {
    const sim = simulateSlots(pf.floatVal);
    multiplier = sim.multiplier;
    gameResult = sim;
  } else if (game.category === "ROULETTE") {
    const sim = simulateRoulette(input.gameData, pf.floatVal);
    multiplier = sim.multiplier;
    gameResult = sim;
  } else if (game.category === "BLACKJACK") {
    const sim = simulateBlackjack(pf.floatVal);
    multiplier = sim.multiplier;
    gameResult = sim;
  } else if (game.category === "CRASH" || slug.includes("crash") || slug.includes("spaceman") || slug.includes("aero")) {
    const sim = simulateCrash(input.gameData, serverSeed, clientSeed, nonce);
    multiplier = sim.multiplier;
    gameResult = sim;
  } else {
    const won = pf.floatVal < 0.45;
    multiplier = won ? 2 : 0;
    gameResult = { won, multiplier, outcome: pf.floatVal };
  }
  const win = bet.mul(multiplier).toDecimalPlaces(8, Prisma4.Decimal.ROUND_HALF_UP);
  if (win.gt(0)) {
    await postJournal(db, {
      userId: user.id,
      type: "WIN",
      currency: user.currency,
      idempotencyKey: `play:${roundId}:win`,
      amount: win,
      referenceType: "game_round",
      referenceId: roundId,
      memo: `Demo win ${game.slug}`,
      lines: [
        { owner: "house", accountType: "AVAILABLE", direction: "DEBIT", amount: win },
        { owner: "player", accountType: "AVAILABLE", direction: "CREDIT", amount: win }
      ]
    });
  }
  const round = await db.gameRound.create({
    data: {
      id: roundId,
      userId: user.id,
      gameId: game.id,
      providerId: game.providerId,
      sessionId: session.id,
      providerTxId,
      status: "SETTLED",
      currency: user.currency,
      betAmount: bet,
      winAmount: win,
      result: {
        demo: true,
        ...gameResult,
        note: "Sandbox provably fair RNG outcome."
      },
      verification: {
        serverSeedHash: pf.serverSeedHash,
        clientSeed,
        nonce
      },
      settledAt: /* @__PURE__ */ new Date()
    }
  });
  await db.gameSession.update({
    where: { id: session.id },
    data: { status: "CLOSED", closedAt: /* @__PURE__ */ new Date() }
  });
  await Promise.all([
    recordVipWager(db, user.id, bet).catch(() => {
    }),
    processBonusWagering(db, user.id, bet).catch(() => {
    })
  ]);
  return {
    mode: "DEMO",
    game: { slug: game.slug, title: game.title, category: game.category },
    betAmount: money2(bet),
    winAmount: money2(win),
    multiplier,
    round,
    gameResult,
    provablyFair: {
      serverSeedHash: pf.serverSeedHash,
      clientSeed,
      nonce
    }
  };
}

// ../../packages/db/dist/sports.js
import { Prisma as Prisma5 } from "@prisma/client";
var SportsError = class extends Error {
  code;
  constructor(code, message) {
    super(message);
    this.code = code;
    this.name = "SportsError";
  }
};
async function placeSportBet(db, input) {
  const stake = new Prisma5.Decimal(input.stake);
  const odds = new Prisma5.Decimal(input.odds);
  if (stake.lte(0)) {
    throw new SportsError("INVALID_STAKE", "Stake must be greater than zero");
  }
  const user = await db.user.findUniqueOrThrow({ where: { id: input.userId } });
  const event = await db.sportEvent.findUnique({
    where: { id: input.eventId },
    include: { markets: true }
  });
  if (!event || event.status === "CANCELLED" || event.status === "FINISHED") {
    throw new SportsError("EVENT_NOT_FOUND", "Event is not open for betting");
  }
  const market = event.markets.find((m) => m.id === input.marketId);
  if (!market || market.status !== "OPEN") {
    throw new SportsError("MARKET_SUSPENDED", "Market is currently suspended");
  }
  const betId = `sb_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  try {
    await postJournal(db, {
      userId: user.id,
      type: "BET",
      currency: user.currency,
      idempotencyKey: `sport-bet:${betId}:stake`,
      amount: stake,
      referenceType: "sport_bet",
      referenceId: betId,
      memo: `Sports Bet: ${event.name} - ${input.selectionName} @ ${odds.toFixed(2)}`,
      lines: [
        { owner: "player", accountType: "AVAILABLE", direction: "DEBIT", amount: stake },
        { owner: "house", accountType: "AVAILABLE", direction: "CREDIT", amount: stake }
      ]
    });
  } catch (error) {
    if (error instanceof LedgerError && error.code === "INSUFFICIENT_FUNDS") {
      throw new SportsError("INSUFFICIENT_FUNDS", "Insufficient available balance to place bet");
    }
    throw error;
  }
  const potentialPayout = stake.mul(odds);
  const sportBet = await db.sportBet.create({
    data: {
      id: betId,
      userId: user.id,
      eventId: event.id,
      marketId: market.id,
      status: "OPEN",
      currency: user.currency,
      stake,
      odds,
      payout: potentialPayout
    },
    include: { event: true, market: true }
  });
  return sportBet;
}
async function getPlayerSportBets(db, userId) {
  return db.sportBet.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { event: true, market: true },
    take: 50
  });
}

// ../../packages/db/dist/kyc.js
import { createHash as createHash2 } from "node:crypto";
var KycError = class extends Error {
  code;
  constructor(code, message) {
    super(message);
    this.code = code;
    this.name = "KycError";
  }
};
async function getOrCreatePlayerKycCase(db, userId) {
  let kycCase = await db.kycCase.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { documents: true }
  });
  if (!kycCase) {
    kycCase = await db.kycCase.create({
      data: {
        userId,
        status: "NOT_STARTED"
      },
      include: { documents: true }
    });
  }
  return kycCase;
}
async function submitKycDocument(db, input) {
  let kycCase = await db.kycCase.findFirst({
    where: { userId: input.userId },
    orderBy: { createdAt: "desc" }
  });
  if (!kycCase || kycCase.status === "APPROVED") {
    kycCase = await db.kycCase.create({
      data: {
        userId: input.userId,
        status: "UNDER_REVIEW"
      }
    });
  } else {
    kycCase = await db.kycCase.update({
      where: { id: kycCase.id },
      data: { status: "UNDER_REVIEW" }
    });
  }
  const checksum = input.fileBufferBase64 ? createHash2("sha256").update(input.fileBufferBase64).digest("hex") : createHash2("sha256").update(`${input.fileName}:${Date.now()}`).digest("hex");
  const storageKey = `kyc/${input.userId}/${Date.now()}_${input.fileName.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
  const doc = await db.kycDocument.create({
    data: {
      caseId: kycCase.id,
      type: input.type,
      storageKey,
      checksum,
      status: "UNDER_REVIEW"
    }
  });
  await db.user.update({
    where: { id: input.userId },
    data: { kycStatus: "UNDER_REVIEW" }
  });
  return { doc, kycCase };
}
async function adminReviewKycCase(db, caseId, adminUserId, decision, reviewNote) {
  const now = /* @__PURE__ */ new Date();
  const kycCase = await db.kycCase.findUnique({
    where: { id: caseId },
    include: { user: true, documents: true }
  });
  if (!kycCase) {
    throw new KycError("CASE_NOT_FOUND", "KYC Case not found");
  }
  const updated = await db.kycCase.update({
    where: { id: caseId },
    data: {
      status: decision,
      reviewedById: adminUserId,
      reviewedAt: now,
      reviewNote,
      documents: {
        updateMany: {
          where: { caseId },
          data: { status: decision }
        }
      }
    },
    include: { documents: true }
  });
  await db.user.update({
    where: { id: kycCase.userId },
    data: {
      kycStatus: decision,
      // If approved, player is realMoneyEligible subject to licensing
      realMoneyEligible: decision === "APPROVED"
    }
  });
  await db.auditLog.create({
    data: {
      actorType: "ADMIN",
      adminId: adminUserId,
      subjectId: kycCase.userId,
      action: `KYC_${decision}`,
      entity: "KycCase",
      entityId: caseId,
      payload: { decision, reviewNote }
    }
  });
  return updated;
}

// ../../packages/db/dist/risk.js
import { Prisma as Prisma6 } from "@prisma/client";
var RiskError = class extends Error {
  code;
  constructor(code, message) {
    super(message);
    this.code = code;
    this.name = "RiskError";
  }
};
async function evaluateTransactionRisk(db, userId, type, amount) {
  const decAmount = new Prisma6.Decimal(amount);
  const flags = [];
  let riskScore = 0;
  const now = /* @__PURE__ */ new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1e3);
  const hourAgo = new Date(now.getTime() - 60 * 60 * 1e3);
  const [user, deposits24h, withdrawals24h, recentDepositsCount] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      include: { kycCases: true, fingerprints: true }
    }),
    db.deposit.aggregate({
      where: { userId, status: "COMPLETED", createdAt: { gte: dayAgo } },
      _sum: { amount: true },
      _count: { id: true }
    }),
    db.withdrawal.aggregate({
      where: { userId, status: "COMPLETED", createdAt: { gte: dayAgo } },
      _sum: { amount: true },
      _count: { id: true }
    }),
    db.deposit.count({
      where: { userId, createdAt: { gte: hourAgo } }
    })
  ]);
  if (!user) {
    return { passed: false, riskScore: 100, flags: ["USER_NOT_FOUND"] };
  }
  if (decAmount.gte(5e3)) {
    flags.push("LARGE_SINGLE_TRANSACTION");
    riskScore += 30;
  }
  if (type === "DEPOSIT" && recentDepositsCount >= 5) {
    flags.push("HIGH_DEPOSIT_VELOCITY_1H");
    riskScore += 25;
  }
  if (type === "WITHDRAWAL" && user.kycStatus !== "APPROVED") {
    flags.push("WITHDRAWAL_WITHOUT_APPROVED_KYC");
    riskScore += 40;
  }
  if (type === "WITHDRAWAL") {
    const totalDep24h = deposits24h._sum.amount ?? new Prisma6.Decimal(0);
    if (totalDep24h.gt(0) && decAmount.gt(totalDep24h.mul(5))) {
      flags.push("RAPID_HIGH_WITHDRAWAL_RATIO");
      riskScore += 30;
    }
  }
  if (riskScore >= 40) {
    await db.amlAlert.create({
      data: {
        userId,
        ruleKey: flags.join("_"),
        severity: riskScore >= 70 ? "HIGH" : "MEDIUM",
        payload: {
          transactionType: type,
          amount: decAmount.toFixed(8),
          flags,
          riskScore
        },
        open: true
      }
    });
    await db.riskEvent.create({
      data: {
        userId,
        kind: type,
        score: riskScore,
        payload: { flags, amount: decAmount.toFixed(8) }
      }
    });
  }
  return {
    passed: riskScore < 80,
    riskScore,
    flags
  };
}
async function resolveAmlAlert(db, alertId, adminUserId, notes) {
  const alert = await db.amlAlert.findUnique({ where: { id: alertId } });
  if (!alert) {
    throw new RiskError("ALERT_NOT_FOUND", "AML Alert not found");
  }
  const updated = await db.amlAlert.update({
    where: { id: alertId },
    data: {
      open: false,
      resolvedAt: /* @__PURE__ */ new Date()
    }
  });
  await db.auditLog.create({
    data: {
      actorType: "ADMIN",
      adminId: adminUserId,
      subjectId: alert.userId,
      action: "AML_ALERT_RESOLVED",
      entity: "AmlAlert",
      entityId: alertId,
      payload: { notes, ruleKey: alert.ruleKey }
    }
  });
  return updated;
}

// ../../packages/db/dist/support.js
var SupportError = class extends Error {
  code;
  constructor(code, message) {
    super(message);
    this.code = code;
    this.name = "SupportError";
  }
};
async function createPlayerTicket(db, input) {
  const ticket = await db.supportTicket.create({
    data: {
      userId: input.userId,
      subject: input.subject.trim(),
      category: input.category,
      priority: input.priority ?? "NORMAL",
      status: "OPEN",
      messages: {
        create: {
          authorType: "PLAYER",
          authorId: input.userId,
          body: input.message.trim(),
          internal: false
        }
      }
    },
    include: { messages: true }
  });
  return ticket;
}
async function addTicketMessage(db, ticketId, authorId, authorType, body, internal = false) {
  const ticket = await db.supportTicket.findUnique({ where: { id: ticketId } });
  if (!ticket) {
    throw new SupportError("TICKET_NOT_FOUND", "Support ticket not found");
  }
  const message = await db.supportMessage.create({
    data: {
      ticketId,
      authorId,
      authorType,
      body: body.trim(),
      internal
    }
  });
  const nextStatus = authorType === "ADMIN" ? "PENDING_PLAYER" : "PENDING_STAFF";
  await db.supportTicket.update({
    where: { id: ticketId },
    data: { status: nextStatus, updatedAt: /* @__PURE__ */ new Date() }
  });
  return message;
}
async function getPlayerTickets(db, userId) {
  return db.supportTicket.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: {
      messages: {
        where: { internal: false },
        orderBy: { createdAt: "asc" }
      }
    }
  });
}
async function getAdminTickets(db, statusFilter) {
  return db.supportTicket.findMany({
    where: statusFilter ? { status: statusFilter } : void 0,
    orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
    include: {
      user: {
        select: {
          id: true,
          email: true,
          profile: { select: { firstName: true, lastName: true } }
        }
      },
      messages: {
        orderBy: { createdAt: "asc" }
      },
      assignee: { select: { id: true, name: true, email: true } }
    }
  });
}

// ../../packages/db/dist/admin.js
import { Prisma as Prisma7 } from "@prisma/client";
import { randomBytes as randomBytes3 } from "node:crypto";
var AdminError = class extends Error {
  code;
  constructor(code, message) {
    super(message);
    this.code = code;
    this.name = "AdminError";
  }
};
async function loginAdmin(db, input) {
  const admin = await db.adminUser.findUnique({
    where: { email: input.email.trim().toLowerCase() },
    include: {
      roles: {
        include: {
          role: {
            include: { permissions: { include: { permission: true } } }
          }
        }
      }
    }
  });
  if (!admin || !admin.active) {
    throw new AdminError("UNAUTHORIZED", "Invalid admin credentials or account inactive");
  }
  const ok = await verifyPassword(input.password, admin.passwordHash);
  if (!ok) {
    throw new AdminError("UNAUTHORIZED", "Invalid admin credentials");
  }
  await db.adminUser.update({
    where: { id: admin.id },
    data: { lastLoginAt: /* @__PURE__ */ new Date() }
  });
  const permissions = /* @__PURE__ */ new Set();
  const roleNames = [];
  for (const ar of admin.roles) {
    roleNames.push(ar.role.name);
    for (const rp of ar.role.permissions) {
      permissions.add(rp.permission.key);
    }
  }
  await db.auditLog.create({
    data: {
      actorType: "ADMIN",
      adminId: admin.id,
      action: "ADMIN_LOGIN",
      entity: "AdminUser",
      entityId: admin.id,
      ip: input.ip
    }
  });
  return {
    admin: {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      roles: roleNames,
      permissions: Array.from(permissions)
    }
  };
}
async function getAdminStatsOverview(db) {
  const [totalPlayers, activePlayers, roundsAgg, depositsAgg, withdrawalsAgg, pendingWithdrawals, openKyc, activeAlerts] = await Promise.all([
    db.user.count({ where: { email: { not: "house@internal.vladfsbet" } } }),
    db.user.count({
      where: {
        lastLoginAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1e3) }
      }
    }),
    db.gameRound.aggregate({
      _sum: { betAmount: true, winAmount: true }
    }),
    db.deposit.aggregate({
      where: { status: "COMPLETED" },
      _sum: { amount: true }
    }),
    db.withdrawal.aggregate({
      where: { status: "COMPLETED" },
      _sum: { amount: true }
    }),
    db.withdrawal.count({ where: { status: "REQUESTED" } }),
    db.kycCase.count({ where: { status: "UNDER_REVIEW" } }),
    db.amlAlert.count({ where: { open: true } })
  ]);
  const totalBets = roundsAgg._sum.betAmount ?? new Prisma7.Decimal(0);
  const totalWins = roundsAgg._sum.winAmount ?? new Prisma7.Decimal(0);
  const ggr = totalBets.sub(totalWins);
  const ngr = ggr.mul(0.85);
  const totalDeposits = depositsAgg._sum.amount ?? new Prisma7.Decimal(0);
  const totalWithdrawals = withdrawalsAgg._sum.amount ?? new Prisma7.Decimal(0);
  return {
    totalPlayers,
    activePlayersToday: activePlayers,
    ggr: ggr.toFixed(2),
    ngr: ngr.toFixed(2),
    totalBetsVolume: totalBets.toFixed(2),
    totalWinsVolume: totalWins.toFixed(2),
    totalDepositsVolume: totalDeposits.toFixed(2),
    totalWithdrawalsVolume: totalWithdrawals.toFixed(2),
    pendingWithdrawalsCount: pendingWithdrawals,
    openKycCasesCount: openKyc,
    activeAmlAlertsCount: activeAlerts
  };
}
async function adminUpdatePlayerStatus(db, adminUserId, targetUserId, newStatus, reason) {
  const user = await db.user.findUnique({ where: { id: targetUserId } });
  if (!user) {
    throw new AdminError("INVALID_INPUT", "Player not found");
  }
  const updated = await db.user.update({
    where: { id: targetUserId },
    data: { status: newStatus }
  });
  if (newStatus === "LOCKED" || newStatus === "SUSPENDED" || newStatus === "CLOSED") {
    await db.session.updateMany({
      where: { userId: targetUserId, revokedAt: null },
      data: { revokedAt: /* @__PURE__ */ new Date() }
    });
  }
  await db.auditLog.create({
    data: {
      actorType: "ADMIN",
      adminId: adminUserId,
      subjectId: targetUserId,
      action: `PLAYER_STATUS_${newStatus}`,
      entity: "User",
      entityId: targetUserId,
      payload: { previousStatus: user.status, newStatus, reason }
    }
  });
  return updated;
}
async function adminManualBalanceAdjustment(db, input) {
  const adjAmount = new Prisma7.Decimal(input.amount);
  if (adjAmount.lte(0)) {
    throw new AdminError("INVALID_INPUT", "Adjustment amount must be greater than zero");
  }
  if (!input.notes || input.notes.trim().length < 5) {
    throw new AdminError("INVALID_INPUT", "Mandatory notes required for manual adjustment");
  }
  const targetUser = await db.user.findUniqueOrThrow({ where: { id: input.targetUserId } });
  const idempotencyKey = `manual-adj:${input.targetUserId}:${Date.now()}:${randomBytes3(4).toString("hex")}`;
  const lines = input.direction === "CREDIT" ? [
    { owner: "house", accountType: "AVAILABLE", direction: "DEBIT", amount: adjAmount },
    { owner: "player", accountType: "AVAILABLE", direction: "CREDIT", amount: adjAmount }
  ] : [
    { owner: "player", accountType: "AVAILABLE", direction: "DEBIT", amount: adjAmount },
    { owner: "house", accountType: "AVAILABLE", direction: "CREDIT", amount: adjAmount }
  ];
  const result = await postJournal(db, {
    userId: input.targetUserId,
    type: "ADJUSTMENT",
    currency: targetUser.currency,
    idempotencyKey,
    amount: adjAmount,
    memo: `Manual adjustment [${input.reasonCode}]: ${input.notes}`,
    lines
  });
  await db.auditLog.create({
    data: {
      actorType: "ADMIN",
      adminId: input.adminUserId,
      subjectId: input.targetUserId,
      action: `MANUAL_ADJUSTMENT_${input.direction}`,
      entity: "LedgerJournal",
      entityId: result.journal.id,
      payload: {
        amount: adjAmount.toFixed(8),
        direction: input.direction,
        reasonCode: input.reasonCode,
        notes: input.notes
      }
    }
  });
  return result;
}

// ../../packages/db/dist/index.js
var globalForPrisma = globalThis;
var prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]
});
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// src/app.ts
var COOKIE = "vladfsbet_session";
var ADMIN_COOKIE = "vladfsbet_admin_session";
var registerSchema = external_exports.object({
  firstName: external_exports.string().min(1),
  lastName: external_exports.string().min(1),
  email: external_exports.string().email(),
  password: external_exports.string().min(10),
  country: external_exports.string().length(2),
  currency: external_exports.string().length(3),
  dateOfBirth: external_exports.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  phone: external_exports.string().min(6).optional(),
  promoCode: external_exports.string().optional(),
  termsAccepted: external_exports.boolean(),
  privacyAccepted: external_exports.boolean(),
  rgAcknowledged: external_exports.boolean()
});
var loginSchema = external_exports.object({
  email: external_exports.string().email(),
  password: external_exports.string().min(1)
});
var changePasswordSchema = external_exports.object({
  oldPassword: external_exports.string().min(1),
  newPassword: external_exports.string().min(10)
});
var updateProfileSchema = external_exports.object({
  firstName: external_exports.string().optional(),
  lastName: external_exports.string().optional(),
  address1: external_exports.string().optional(),
  city: external_exports.string().optional(),
  postalCode: external_exports.string().optional()
});
var creditSchema = external_exports.object({
  amount: external_exports.string().default("100")
});
var depositSchema = external_exports.object({
  providerId: external_exports.string(),
  method: external_exports.string(),
  amount: external_exports.string()
});
var withdrawalSchema = external_exports.object({
  providerId: external_exports.string(),
  method: external_exports.string(),
  amount: external_exports.string()
});
var playSchema = external_exports.object({
  betAmount: external_exports.string(),
  gameData: external_exports.record(external_exports.unknown()).optional()
});
var sportBetSchema = external_exports.object({
  eventId: external_exports.string(),
  marketId: external_exports.string(),
  selectionName: external_exports.string(),
  odds: external_exports.string(),
  stake: external_exports.string()
});
var promoCodeSchema = external_exports.object({
  code: external_exports.string().min(1)
});
var claimBonusSchema = external_exports.object({
  templateSlug: external_exports.string()
});
var kycUploadSchema = external_exports.object({
  type: external_exports.enum(["PASSPORT", "NATIONAL_ID", "DRIVERS_LICENSE", "UTILITY_BILL", "BANK_STATEMENT"]),
  fileName: external_exports.string(),
  fileBufferBase64: external_exports.string().optional()
});
var rgLimitSchema = external_exports.object({
  type: external_exports.enum(["DEPOSIT", "LOSS", "WAGER", "SESSION_TIME"]),
  amount: external_exports.string().optional(),
  minutes: external_exports.number().optional(),
  periodHours: external_exports.number().default(24)
});
var coolingOffSchema = external_exports.object({
  hours: external_exports.number().min(24).max(720),
  // 1 to 30 days
  reason: external_exports.string().optional()
});
var selfExclusionSchema = external_exports.object({
  months: external_exports.number().optional(),
  permanent: external_exports.boolean().default(false),
  reason: external_exports.string().optional()
});
var ticketSchema = external_exports.object({
  subject: external_exports.string().min(3),
  category: external_exports.string().default("GENERAL"),
  priority: external_exports.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
  message: external_exports.string().min(5)
});
var ticketMessageSchema = external_exports.object({
  body: external_exports.string().min(1)
});
function clientMeta(c) {
  return {
    ip: c.req.header("x-forwarded-for") ?? "127.0.0.1",
    userAgent: c.req.header("user-agent") ?? void 0
  };
}
function setSessionCookie(c, token, name = COOKIE) {
  setCookie(c, name, token, {
    httpOnly: true,
    sameSite: "Lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
    secure: process.env.NODE_ENV === "production"
  });
}
function createApp() {
  const app2 = new Hono2();
  app2.use(
    "*",
    cors({
      origin: (origin) => origin || "*",
      credentials: true,
      allowHeaders: ["Content-Type", "Authorization", "Cookie", "X-Requested-With"],
      allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"]
    })
  );
  app2.onError((error, c) => {
    if (error instanceof ZodError) {
      return c.json({ error: "INVALID_INPUT", message: error.issues[0]?.message ?? "Invalid input" }, 400);
    }
    if (error instanceof AuthError || error instanceof LedgerError || error instanceof PlayError || error instanceof RgError || error instanceof BonusError || error instanceof SportsError || error instanceof KycError || error instanceof RiskError || error instanceof SupportError || error instanceof AdminError) {
      return c.json({ error: error.code, message: error.message }, 400);
    }
    console.error("API error:", error);
    return c.json({ error: "INTERNAL", message: error?.message ?? "Unexpected error" }, 500);
  });
  app2.get(
    "/",
    (c) => c.json({
      name: "VladfsBET API",
      version: "1.0.0",
      status: "operational",
      environment: process.env.NODE_ENV ?? "production",
      endpoints: {
        health: "/health",
        ready: "/ready",
        games: "/api/games",
        me: "/api/auth/me",
        wallet: "/api/wallet"
      }
    })
  );
  app2.get("/favicon.ico", (c) => c.body(null, 204));
  app2.get("/health", (c) => c.json({ ok: true, service: "vladfsbet-api", timestamp: /* @__PURE__ */ new Date() }));
  app2.get("/ready", async (c) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return c.json({ ok: true, database: "connected" });
    } catch (err) {
      return c.json({ ok: false, database: "disconnected", error: err?.message }, 503);
    }
  });
  app2.post("/api/auth/register", async (c) => {
    const body = registerSchema.parse(await c.req.json());
    const result = await registerPlayer(prisma, { ...body, ...clientMeta(c) });
    setSessionCookie(c, result.sessionToken);
    return c.json({ user: result.user }, 201);
  });
  app2.post("/api/auth/login", async (c) => {
    const body = loginSchema.parse(await c.req.json());
    const result = await loginPlayer(prisma, { ...body, ...clientMeta(c) });
    setSessionCookie(c, result.sessionToken);
    return c.json({ user: result.user });
  });
  app2.post("/api/auth/logout", async (c) => {
    await revokeSession(prisma, getCookie(c, COOKIE));
    deleteCookie(c, COOKIE, { path: "/" });
    return c.json({ ok: true });
  });
  app2.get("/api/auth/me", async (c) => {
    const user = await getSessionUser(prisma, getCookie(c, COOKIE));
    if (!user) {
      return c.json({ error: "UNAUTHENTICATED", message: "Sign in required" }, 401);
    }
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        profile: true,
        vipProgress: { include: { level: true } }
      }
    });
    return c.json({
      user: {
        ...user,
        profile: fullUser?.profile,
        vipTier: fullUser?.vipProgress?.level ? {
          name: fullUser.vipProgress.level.name,
          slug: fullUser.vipProgress.level.slug,
          points: fullUser.vipProgress.points.toFixed(0),
          rank: fullUser.vipProgress.level.rank,
          cashbackBps: fullUser.vipProgress.level.cashbackBps
        } : void 0
      }
    });
  });
  app2.post("/api/auth/change-password", async (c) => {
    const user = await getSessionUser(prisma, getCookie(c, COOKIE));
    if (!user) return c.json({ error: "UNAUTHENTICATED" }, 401);
    const body = changePasswordSchema.parse(await c.req.json());
    await changePassword(prisma, user.id, body.oldPassword, body.newPassword);
    return c.json({ ok: true, message: "Password updated successfully" });
  });
  app2.post("/api/auth/profile", async (c) => {
    const user = await getSessionUser(prisma, getCookie(c, COOKIE));
    if (!user) return c.json({ error: "UNAUTHENTICATED" }, 401);
    const body = updateProfileSchema.parse(await c.req.json());
    const profile = await updateUserProfile(prisma, user.id, body);
    return c.json({ profile });
  });
  app2.get("/api/auth/sessions", async (c) => {
    const token = getCookie(c, COOKIE);
    const user = await getSessionUser(prisma, token);
    if (!user) return c.json({ error: "UNAUTHENTICATED" }, 401);
    const sessions = await getUserSessions(prisma, user.id, token);
    return c.json({ sessions });
  });
  app2.post("/api/auth/sessions/revoke-others", async (c) => {
    const token = getCookie(c, COOKIE);
    const user = await getSessionUser(prisma, token);
    if (!user || !token) return c.json({ error: "UNAUTHENTICATED" }, 401);
    await revokeOtherSessions(prisma, user.id, token);
    return c.json({ ok: true });
  });
  app2.get("/api/wallet", async (c) => {
    const user = await getSessionUser(prisma, getCookie(c, COOKIE));
    if (!user) return c.json({ error: "UNAUTHENTICATED" }, 401);
    const snapshot = await getWalletSnapshot(prisma, user.id, user.currency);
    return c.json({ wallet: snapshot, realMoney: false });
  });
  app2.get("/api/wallet/transactions", async (c) => {
    const user = await getSessionUser(prisma, getCookie(c, COOKIE));
    if (!user) return c.json({ error: "UNAUTHENTICATED" }, 401);
    const items = await prisma.moneyTransaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        type: true,
        status: true,
        currency: true,
        amount: true,
        createdAt: true
      }
    });
    return c.json({
      items: items.map((item) => ({
        ...item,
        amount: item.amount.toFixed(8)
      }))
    });
  });
  app2.get("/api/wallet/payment-methods", async (c) => {
    const providers = await prisma.paymentProvider.findMany({
      where: { active: true },
      orderBy: { name: "asc" }
    });
    return c.json({
      items: providers.map((p) => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        sandbox: p.sandbox
      }))
    });
  });
  app2.post("/api/wallet/demo-credit", async (c) => {
    const user = await getSessionUser(prisma, getCookie(c, COOKIE));
    if (!user) return c.json({ error: "UNAUTHENTICATED" }, 401);
    const body = creditSchema.parse(await c.req.json().catch(() => ({})) ?? {});
    const key = c.req.header("idempotency-key") ?? `demo-credit:${user.id}:${body.amount}:${Date.now()}`;
    await creditDemo(prisma, user.id, user.currency, body.amount, key);
    const snapshot = await getWalletSnapshot(prisma, user.id, user.currency);
    return c.json({ wallet: snapshot, realMoney: false });
  });
  app2.post("/api/wallet/deposit", async (c) => {
    const user = await getSessionUser(prisma, getCookie(c, COOKIE));
    if (!user) return c.json({ error: "UNAUTHENTICATED" }, 401);
    const body = depositSchema.parse(await c.req.json());
    await evaluateTransactionRisk(prisma, user.id, "DEPOSIT", body.amount);
    const key = c.req.header("idempotency-key") ?? `dep:${user.id}:${Date.now()}`;
    const result = await processDeposit(prisma, {
      userId: user.id,
      providerId: body.providerId,
      method: body.method,
      amount: body.amount,
      currency: user.currency,
      idempotencyKey: key
    });
    const snapshot = await getWalletSnapshot(prisma, user.id, user.currency);
    return c.json({ deposit: result.deposit, wallet: snapshot });
  });
  app2.post("/api/wallet/withdrawal", async (c) => {
    const user = await getSessionUser(prisma, getCookie(c, COOKIE));
    if (!user) return c.json({ error: "UNAUTHENTICATED" }, 401);
    const body = withdrawalSchema.parse(await c.req.json());
    await evaluateTransactionRisk(prisma, user.id, "WITHDRAWAL", body.amount);
    const key = c.req.header("idempotency-key") ?? `wd:${user.id}:${Date.now()}`;
    const result = await requestWithdrawal(prisma, {
      userId: user.id,
      providerId: body.providerId,
      method: body.method,
      amount: body.amount,
      currency: user.currency,
      idempotencyKey: key
    });
    const snapshot = await getWalletSnapshot(prisma, user.id, user.currency);
    return c.json({ withdrawal: result.withdrawal, wallet: snapshot });
  });
  app2.get("/api/games", async (c) => {
    const category = c.req.query("category");
    const search = c.req.query("search");
    const where = {
      active: true,
      demoAvailable: true
    };
    if (category && category !== "ALL") {
      where.category = category;
    }
    if (search) {
      where.title = { contains: search, mode: "insensitive" };
    }
    const games = await prisma.game.findMany({
      where,
      include: { provider: true },
      orderBy: { title: "asc" }
    });
    return c.json({
      items: games.map((game) => ({
        id: game.id,
        slug: game.slug,
        title: game.title,
        category: game.category,
        provider: game.provider.name,
        description: game.description,
        rtpBps: game.rtpBps,
        volatility: game.volatility,
        minBet: game.minBet?.toFixed(2),
        maxBet: game.maxBet?.toFixed(2),
        tags: game.tags,
        demo: true
      }))
    });
  });
  app2.get("/api/games/favorites", async (c) => {
    const user = await getSessionUser(prisma, getCookie(c, COOKIE));
    if (!user) return c.json({ error: "UNAUTHENTICATED" }, 401);
    const rows = await prisma.favoriteGame.findMany({
      where: { userId: user.id },
      include: { game: true }
    });
    return c.json({ slugs: rows.map((row) => row.game.slug) });
  });
  app2.post("/api/games/:slug/favorite", async (c) => {
    const user = await getSessionUser(prisma, getCookie(c, COOKIE));
    if (!user) return c.json({ error: "UNAUTHENTICATED" }, 401);
    const slug = c.req.param("slug");
    const game = await prisma.game.findUnique({ where: { slug } });
    if (!game || !game.active) return c.json({ error: "GAME_NOT_FOUND" }, 404);
    const existing = await prisma.favoriteGame.findUnique({
      where: { userId_gameId: { userId: user.id, gameId: game.id } }
    });
    if (existing) {
      await prisma.favoriteGame.delete({
        where: { userId_gameId: { userId: user.id, gameId: game.id } }
      });
    } else {
      await prisma.favoriteGame.create({
        data: { userId: user.id, gameId: game.id }
      });
    }
    const rows = await prisma.favoriteGame.findMany({
      where: { userId: user.id },
      include: { game: true }
    });
    return c.json({ favorited: !existing, slugs: rows.map((row) => row.game.slug) });
  });
  app2.get("/api/games/:slug", async (c) => {
    const slug = c.req.param("slug");
    const game = await prisma.game.findUnique({
      where: { slug },
      include: { provider: true }
    });
    if (!game || !game.active) return c.json({ error: "GAME_NOT_FOUND" }, 404);
    return c.json({
      game: {
        id: game.id,
        slug: game.slug,
        title: game.title,
        category: game.category,
        provider: game.provider.name,
        description: game.description,
        rtpBps: game.rtpBps,
        volatility: game.volatility,
        minBet: game.minBet?.toFixed(2),
        maxBet: game.maxBet?.toFixed(2),
        tags: game.tags,
        demo: true
      }
    });
  });
  app2.post("/api/games/:slug/play", async (c) => {
    const user = await getSessionUser(prisma, getCookie(c, COOKIE));
    if (!user) return c.json({ error: "UNAUTHENTICATED" }, 401);
    const body = playSchema.parse(await c.req.json());
    const result = await playDemoGame(prisma, {
      userId: user.id,
      slug: c.req.param("slug"),
      betAmount: body.betAmount,
      gameData: body.gameData
    });
    const wallet = await getWalletSnapshot(prisma, user.id, user.currency);
    return c.json({
      mode: result.mode,
      game: result.game,
      betAmount: result.betAmount,
      winAmount: result.winAmount,
      multiplier: result.multiplier,
      roundId: result.round.id,
      gameResult: result.gameResult,
      provablyFair: result.provablyFair,
      wallet
    });
  });
  app2.get("/api/sports/events", async (c) => {
    const sport = c.req.query("sport");
    const events = await prisma.sportEvent.findMany({
      where: sport ? { sport } : void 0,
      include: { markets: true },
      orderBy: { startsAt: "asc" }
    });
    return c.json({ items: events });
  });
  app2.post("/api/sports/bet", async (c) => {
    const user = await getSessionUser(prisma, getCookie(c, COOKIE));
    if (!user) return c.json({ error: "UNAUTHENTICATED" }, 401);
    const body = sportBetSchema.parse(await c.req.json());
    const bet = await placeSportBet(prisma, {
      userId: user.id,
      eventId: body.eventId,
      marketId: body.marketId,
      selectionName: body.selectionName,
      odds: body.odds,
      stake: body.stake
    });
    const wallet = await getWalletSnapshot(prisma, user.id, user.currency);
    return c.json({ bet, wallet });
  });
  app2.get("/api/sports/my-bets", async (c) => {
    const user = await getSessionUser(prisma, getCookie(c, COOKIE));
    if (!user) return c.json({ error: "UNAUTHENTICATED" }, 401);
    const bets = await getPlayerSportBets(prisma, user.id);
    return c.json({ items: bets });
  });
  app2.get("/api/bonuses", async (c) => {
    const user = await getSessionUser(prisma, getCookie(c, COOKIE));
    if (!user) return c.json({ error: "UNAUTHENTICATED" }, 401);
    const bonuses = await prisma.playerBonus.findMany({
      where: { userId: user.id },
      include: { template: true, bonusWallet: true },
      orderBy: { createdAt: "desc" }
    });
    return c.json({
      items: bonuses.map((b) => ({
        id: b.id,
        slug: b.template.slug,
        name: b.template.name,
        type: b.template.type,
        awarded: b.awarded.toFixed(2),
        status: b.status,
        remaining: b.bonusWallet?.remaining.toFixed(2) ?? "0.00",
        wagered: b.bonusWallet?.wagered.toFixed(2) ?? "0.00",
        wageringRequired: b.bonusWallet?.wageringRequired.toFixed(2) ?? "0.00",
        terms: b.template.terms
      }))
    });
  });
  app2.get("/api/bonuses/templates", async (c) => {
    const templates = await prisma.bonusTemplate.findMany({
      where: { active: true },
      orderBy: { createdAt: "desc" }
    });
    return c.json({ items: templates });
  });
  app2.post("/api/bonuses/claim", async (c) => {
    const user = await getSessionUser(prisma, getCookie(c, COOKIE));
    if (!user) return c.json({ error: "UNAUTHENTICATED" }, 401);
    const body = claimBonusSchema.parse(await c.req.json());
    const bonus = await claimBonusTemplate(prisma, user.id, body.templateSlug);
    const wallet = await getWalletSnapshot(prisma, user.id, user.currency);
    return c.json({ bonus, wallet });
  });
  app2.post("/api/bonuses/redeem-code", async (c) => {
    const user = await getSessionUser(prisma, getCookie(c, COOKIE));
    if (!user) return c.json({ error: "UNAUTHENTICATED" }, 401);
    const body = promoCodeSchema.parse(await c.req.json());
    const result = await redeemPromoCode(prisma, user.id, body.code);
    const wallet = await getWalletSnapshot(prisma, user.id, user.currency);
    return c.json({ result, wallet });
  });
  app2.post("/api/vip/claim-cashback", async (c) => {
    const user = await getSessionUser(prisma, getCookie(c, COOKIE));
    if (!user) return c.json({ error: "UNAUTHENTICATED" }, 401);
    const result = await claimVipCashback(prisma, user.id);
    const wallet = await getWalletSnapshot(prisma, user.id, user.currency);
    return c.json({ result, wallet });
  });
  app2.get("/api/kyc/case", async (c) => {
    const user = await getSessionUser(prisma, getCookie(c, COOKIE));
    if (!user) return c.json({ error: "UNAUTHENTICATED" }, 401);
    const kycCase = await getOrCreatePlayerKycCase(prisma, user.id);
    return c.json({ kycCase });
  });
  app2.post("/api/kyc/upload", async (c) => {
    const user = await getSessionUser(prisma, getCookie(c, COOKIE));
    if (!user) return c.json({ error: "UNAUTHENTICATED" }, 401);
    const body = kycUploadSchema.parse(await c.req.json());
    const result = await submitKycDocument(prisma, {
      userId: user.id,
      type: body.type,
      fileName: body.fileName,
      fileBufferBase64: body.fileBufferBase64
    });
    return c.json({ result });
  });
  app2.get("/api/responsible-gaming/summary", async (c) => {
    const user = await getSessionUser(prisma, getCookie(c, COOKIE));
    if (!user) return c.json({ error: "UNAUTHENTICATED" }, 401);
    const summary = await getPlayerRgSummary(prisma, user.id);
    return c.json({ summary });
  });
  app2.post("/api/responsible-gaming/limit", async (c) => {
    const user = await getSessionUser(prisma, getCookie(c, COOKIE));
    if (!user) return c.json({ error: "UNAUTHENTICATED" }, 401);
    const body = rgLimitSchema.parse(await c.req.json());
    const limit = await setResponsibleGamingLimit(prisma, {
      userId: user.id,
      type: body.type,
      amount: body.amount,
      minutes: body.minutes,
      periodHours: body.periodHours
    });
    return c.json({ limit });
  });
  app2.post("/api/responsible-gaming/cooling-off", async (c) => {
    const user = await getSessionUser(prisma, getCookie(c, COOKIE));
    if (!user) return c.json({ error: "UNAUTHENTICATED" }, 401);
    const body = coolingOffSchema.parse(await c.req.json());
    const result = await applyCoolingOff(prisma, {
      userId: user.id,
      hours: body.hours,
      reason: body.reason
    });
    deleteCookie(c, COOKIE, { path: "/" });
    return c.json(result);
  });
  app2.post("/api/responsible-gaming/self-exclude", async (c) => {
    const user = await getSessionUser(prisma, getCookie(c, COOKIE));
    if (!user) return c.json({ error: "UNAUTHENTICATED" }, 401);
    const body = selfExclusionSchema.parse(await c.req.json());
    const result = await applySelfExclusion(prisma, {
      userId: user.id,
      months: body.months,
      permanent: body.permanent,
      reason: body.reason
    });
    deleteCookie(c, COOKIE, { path: "/" });
    return c.json(result);
  });
  app2.get("/api/support/tickets", async (c) => {
    const user = await getSessionUser(prisma, getCookie(c, COOKIE));
    if (!user) return c.json({ error: "UNAUTHENTICATED" }, 401);
    const tickets = await getPlayerTickets(prisma, user.id);
    return c.json({ items: tickets });
  });
  app2.post("/api/support/tickets", async (c) => {
    const user = await getSessionUser(prisma, getCookie(c, COOKIE));
    if (!user) return c.json({ error: "UNAUTHENTICATED" }, 401);
    const body = ticketSchema.parse(await c.req.json());
    const ticket = await createPlayerTicket(prisma, {
      userId: user.id,
      subject: body.subject,
      category: body.category,
      priority: body.priority,
      message: body.message
    });
    return c.json({ ticket }, 201);
  });
  app2.post("/api/support/tickets/:id/message", async (c) => {
    const user = await getSessionUser(prisma, getCookie(c, COOKIE));
    if (!user) return c.json({ error: "UNAUTHENTICATED" }, 401);
    const body = ticketMessageSchema.parse(await c.req.json());
    const message = await addTicketMessage(prisma, c.req.param("id"), user.id, "PLAYER", body.body);
    return c.json({ message }, 201);
  });
  app2.post("/api/admin/auth/login", async (c) => {
    const body = loginSchema.parse(await c.req.json());
    const result = await loginAdmin(prisma, { ...body, ...clientMeta(c) });
    setSessionCookie(c, `admin_${result.admin.id}`, ADMIN_COOKIE);
    return c.json(result);
  });
  app2.get("/api/admin/overview", async (c) => {
    const stats = await getAdminStatsOverview(prisma);
    return c.json({ stats });
  });
  app2.get("/api/admin/players", async (c) => {
    const search = c.req.query("search");
    const players = await prisma.user.findMany({
      where: {
        email: { not: "house@internal.vladfsbet", contains: search ?? void 0, mode: "insensitive" }
      },
      include: {
        profile: true,
        wallets: { include: { accounts: true } },
        kycCases: { orderBy: { createdAt: "desc" }, take: 1 }
      },
      orderBy: { createdAt: "desc" },
      take: 50
    });
    return c.json({
      items: players.map((p) => ({
        id: p.id,
        email: p.email,
        name: p.profile ? `${p.profile.firstName} ${p.profile.lastName}` : "Unnamed",
        country: p.country,
        currency: p.currency,
        status: p.status,
        kycStatus: p.kycStatus,
        createdAt: p.createdAt.toISOString(),
        availableBalance: p.wallets[0]?.accounts.find((a) => a.type === "AVAILABLE")?.cachedBalance.toFixed(2) ?? "0.00"
      }))
    });
  });
  app2.post("/api/admin/players/:id/status", async (c) => {
    const body = external_exports.object({ status: external_exports.any(), reason: external_exports.string() }).parse(await c.req.json());
    const updated = await adminUpdatePlayerStatus(prisma, "admin-system", c.req.param("id"), body.status, body.reason);
    return c.json({ player: updated });
  });
  app2.get("/api/admin/withdrawals", async (c) => {
    const withdrawals = await prisma.withdrawal.findMany({
      orderBy: { createdAt: "desc" },
      include: { user: { select: { email: true, kycStatus: true } }, provider: true },
      take: 50
    });
    return c.json({ items: withdrawals });
  });
  app2.post("/api/admin/withdrawals/:id/approve", async (c) => {
    const body = external_exports.object({ reviewNote: external_exports.string().optional() }).parse(await c.req.json().catch(() => ({})) ?? {});
    const updated = await adminApproveWithdrawal(prisma, c.req.param("id"), "admin-system", body.reviewNote);
    return c.json({ withdrawal: updated });
  });
  app2.post("/api/admin/withdrawals/:id/reject", async (c) => {
    const body = external_exports.object({ reason: external_exports.string().min(3) }).parse(await c.req.json());
    const updated = await adminRejectWithdrawal(prisma, c.req.param("id"), "admin-system", body.reason);
    return c.json({ withdrawal: updated });
  });
  app2.post("/api/admin/ledger/adjust", async (c) => {
    const body = external_exports.object({
      targetUserId: external_exports.string().uuid(),
      amount: external_exports.string(),
      direction: external_exports.enum(["CREDIT", "DEBIT"]),
      reasonCode: external_exports.enum(["CORRECTION", "DISPUTE_SETTLEMENT", "GOODWILL", "TEST_CREDIT"]),
      notes: external_exports.string().min(5)
    }).parse(await c.req.json());
    const result = await adminManualBalanceAdjustment(prisma, {
      adminUserId: "admin-system",
      targetUserId: body.targetUserId,
      amount: body.amount,
      direction: body.direction,
      reasonCode: body.reasonCode,
      notes: body.notes
    });
    return c.json({ result });
  });
  app2.get("/api/admin/kyc", async (c) => {
    const cases = await prisma.kycCase.findMany({
      orderBy: { createdAt: "desc" },
      include: { user: { select: { email: true, country: true } }, documents: true },
      take: 50
    });
    return c.json({ items: cases });
  });
  app2.post("/api/admin/kyc/:id/review", async (c) => {
    const body = external_exports.object({
      decision: external_exports.enum(["APPROVED", "REJECTED", "REQUIRES_INFORMATION"]),
      reviewNote: external_exports.string().optional()
    }).parse(await c.req.json());
    const updated = await adminReviewKycCase(prisma, c.req.param("id"), "admin-system", body.decision, body.reviewNote);
    return c.json({ kycCase: updated });
  });
  app2.get("/api/admin/risk/alerts", async (c) => {
    const alerts = await prisma.amlAlert.findMany({
      orderBy: { createdAt: "desc" },
      include: { user: { select: { email: true, country: true } } },
      take: 50
    });
    return c.json({ items: alerts });
  });
  app2.post("/api/admin/risk/alerts/:id/resolve", async (c) => {
    const body = external_exports.object({ notes: external_exports.string().optional() }).parse(await c.req.json().catch(() => ({})) ?? {});
    const updated = await resolveAmlAlert(prisma, c.req.param("id"), "admin-system", body.notes);
    return c.json({ alert: updated });
  });
  app2.get("/api/admin/support/tickets", async (c) => {
    const tickets = await getAdminTickets(prisma);
    return c.json({ items: tickets });
  });
  app2.post("/api/admin/support/tickets/:id/message", async (c) => {
    const body = external_exports.object({ body: external_exports.string().min(1), internal: external_exports.boolean().default(false) }).parse(await c.req.json());
    const message = await addTicketMessage(prisma, c.req.param("id"), "admin-system", "ADMIN", body.body, body.internal);
    return c.json({ message });
  });
  app2.get("/api/admin/audit-logs", async (c) => {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100
    });
    return c.json({ items: logs });
  });
  return app2;
}

// src/serverless.ts
var app = createApp();
var GET = handle(app);
var POST = handle(app);
var PUT = handle(app);
var PATCH = handle(app);
var DELETE = handle(app);
var OPTIONS = handle(app);
var serverless_default = handle(app);
export {
  DELETE,
  GET,
  OPTIONS,
  PATCH,
  POST,
  PUT,
  serverless_default as default
};
