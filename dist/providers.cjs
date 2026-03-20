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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var providers_exports = {};
__export(providers_exports, {
  GitHub: () => GitHub,
  Google: () => Google
});
module.exports = __toCommonJS(providers_exports);
var import_arctic = require("arctic");
function GitHub(config) {
  return {
    id: "github",
    handler: new import_arctic.GitHub(config.clientId, config.clientSecret, null)
  };
}
function Google(config) {
  if (!config.redirectURI) {
    throw new Error("redirectURI is required for Google OAuth provider");
  }
  return {
    id: "google",
    handler: new import_arctic.Google(
      config.clientId,
      config.clientSecret,
      config.redirectURI
    )
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  GitHub,
  Google
});
//# sourceMappingURL=providers.cjs.map
