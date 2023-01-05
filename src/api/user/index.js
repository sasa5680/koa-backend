const Router = require("koa-router");

const user = new Router();
const userCtrl = require("./user.controller");

user.get("/:username", userCtrl.read);
user.delete("/:username", userCtrl.delete);
user.patch("/:username", userCtrl.update);

module.exports = user;
