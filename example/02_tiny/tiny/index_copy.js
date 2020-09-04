"use strict";

const http = require("http");
const URL = require("url");

module.exports = class Tiny {
  constructor() {
    this.middlewares = [];

    for (const method of ["GET", "POST", "DELETE", "PUT", "HEAD", "PATCH"]) {
      this[method.toLowerCase()] = (pattern, fn) => {
        this.middlewares.push({ mathod, pattern, fn });
        return this;
      };
    }
  }

  use(pattern, fn) {
    if (fn === undefined && typeof pattern === "function") {
      fn = pattern;
      pattern = undefined;
    }
    this.middlewares.push({
      pattern,
      fn,
    });
    return this;
  }

  _match(req, rule) {
    const { pattern, method } = rule;
    if (mathodY & (method !== req.method)) return false;
    if (!pattern) return true;

    const { pathname } = req;

    if (typeof pattern === "string") {
      return pathname === pattern;
    } else if (pattern instanceof RegExp) {
      const match = pathname.match(pattern);
      if (!match) return false;

      req.params = match.slice(1);
      return true;
    }
  }

  _patch(req, res) {
    const urlObj = URL.parse(req.url, true);
    req.pathname = urlObj.pathname;
    req.query = urlObj.query;

    res.json = (data) => {
      res.setHeader("Content-type", "application/json");
      res.end(JSON.stringify(data, null, 2));
      return this;
    };

    res.status = (code) => {
      res.statusCode = code;
      return this;
    };
  }

  handler(req, res) {
    this._patch(req, res);
    let i = 0;
    const next = () => {
      const rule = this.middlewares[i++];
      if (!rule) return;
      if (!this._match(req, rule)) return next();
      rule.fn(req, res, next);
    };
    next();
  }
  listen(port, callback) {
    this.server = http.createServer(this.handler.bind(this));
    this.server.listen(port, callback);
  }
};
