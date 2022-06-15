const Router = require("koa-router");

const post = new Router();
const postCtrl = require("./post.controller");

post.get("/list", postCtrl.readPage);
post.get("/list/query/:query", postCtrl.readPageAndQuery);
post.get("/list/user/:userId", postCtrl.readPageAndUser);
post.post("/create", postCtrl.create);
post.get("/:id", postCtrl.read);
post.post("/:id", postCtrl.update);
post.delete("/:id/image/:filename", postCtrl.deletePostImage);
post.delete("/:id", postCtrl.delete)
post.post("/:id/like", postCtrl.likePost);
post.post("/:id/reply", postCtrl.createReply);
post.delete("/:id/reply/:replyId", postCtrl.deleteReply);
module.exports = post;
