"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
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
var __reExport = (target, mod, secondTarget) => (__copyProps(target, mod, "default"), secondTarget && __copyProps(secondTarget, mod, "default"));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var index_exports = {};
__export(index_exports, {
  GitHub: () => import_providers.GitHub,
  Google: () => import_providers.Google,
  createAuth: () => import_core.createAuth,
  createMemoryAdapter: () => import_memoryAdapter.createMemoryAdapter,
  generateSecret: () => import_core.generateSecret
});
module.exports = __toCommonJS(index_exports);
var import_providers = require("./providers.js");
var import_core = require("./core.js");
var import_memoryAdapter = require("./memoryAdapter.js");
__reExport(index_exports, require("./security.js"), module.exports);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  GitHub,
  Google,
  createAuth,
  createMemoryAdapter,
  generateSecret,
  ...require("./security.js")
});
//# sourceMappingURL=index.cjs.map
