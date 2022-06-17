const Joi = require("joi");
const {
  Types: {
    ObjectId
  },
} = require("mongoose");

let Account = require("../../models/account");

//유저 읽어오기
exports.read = async (ctx) => {
  let user = null;

  try {

    user = await Account.findByUsername(ctx.params.username);

    if (user === null) throw "없는 유저입니다.";
    ctx.body = user;

  } catch (error) {

    ctx.status = 404;
  }

}

//유저 삭제
exports.delete = async (ctx) => {

  const {
    user
  } = ctx.request;

  const {
    username
  } = ctx.params;

  if (user.username !== username) {
    ctx.status = 403;
    return;
  }

}

//유저 업데이트
exports.update = async (ctx) => {
  //로그인 검사
  const {
    user
  } = ctx.request;

  const {
    username
  } = ctx.params;

  if (user.profile.username !== username) {
    ctx.status = 403;
    return;
  }

  let file = ctx.request.files.thumbnail;

  try {

    await Account.updateUser(username, ctx.request.body, file);
    ctx.status = 201;

  } catch (error) {
    console.log(error)
    ctx.status = 500;
  }

};