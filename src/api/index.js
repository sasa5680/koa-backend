const Router = require("koa-router");

const api = new Router();

const auth = require("./auth")
const post = require("./post")
const user = require("./user")

api.use("/auth", auth.routes());
api.use("/post", post.routes());
api.use("/user", user.routes());

module.exports = api;
