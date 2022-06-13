const axios = require("axios");

const Joi = require("joi");
const {
  Types: {
    ObjectId
  },
} = require("mongoose");

let Account = require("../../models/account");

// 로컬 회원가입
exports.localRegister = async (ctx) => {
  // 데이터 검증
  const schema = Joi.object().keys({
    //유저의 이름
    username: Joi.string().alphanum().min(4).max(15).required(),
    //유저 이메일
    email: Joi.string().email().required(),
    password: Joi.string().required().min(6),
    confirm: Joi.string().required().valid(Joi.ref("password")),
    intro: Joi.string(),
  });

  console.log(ctx.request.body);

  const result = schema.validate(ctx.request.body);

  // 스키마 검증 실패
  if (result.error) {
    console.log(result);
    ctx.status = 400;
    return;
  }

  // 아이디 / 이메일 중복 체크
  let existing = null;
  try {
    existing = await Account.findByEmailOrUsername(ctx.request.body);
  } catch (e) {
    ctx.throw(500, e);
  }

  if (existing) {
    // 중복되는 아이디/이메일이 있을 경우
    ctx.status = 409; // Conflict
    // 어떤 값이 중복되었는지 알려줍니다
    ctx.body = {
      key: existing.email === ctx.request.body.email ? "email" : "username",
    };
    return;
  }

  let file = ctx.request.files.thumbnail;
  //파일이 하나만 들어오면 객체로 들어오고, 2개 이상이면 배열로 들어온다.

  // 계정 생성
  let account = null;
  try {
    account = await Account.localRegister({
      ...ctx.request.body,
      thumbnail: file,
    });
  } catch (e) {
    ctx.throw(500, e);
  }

  ctx.body = account.profile; // 프로필 정보로 응답합니다.
};

// 로컬 로그인
exports.localLogin = async (ctx) => {
  // 데이터 검증
  // const schema = Joi.object().keys({
  //     email: Joi.string().email().required(),
  //     password: Joi.string().required(),
  // });

  // console.log(ctx.request.body);

  // const result = schema.validate(ctx.request.body);

  // if (result.error) {
  //     ctx.status = 400; // Bad Request
  //     return;
  // }

  const {
    email,
    password
  } = ctx.request.body;

  let account = null;
  try {
    // 이메일로 계정 찾기
    account = await Account.findByEmail(email);
  } catch (e) {
    ctx.throw(500, e);
  }

  if (!account || !account.validatePassword(password)) {
    // 유저가 존재하지 않거나 || 비밀번호가 일치하지 않으면
    ctx.status = 403; // Forbidden
    return;
  }

  let token = null;
  try {
    token = await account.generateToken();
  } catch (e) {
    ctx.throw(500, e);
  }

  ctx.body = {
    id: account.id,
    token: token,
    thumbnail: account.profile.thumbnail,
    username: account.profile.username,
  };
  //ctx.body = account.profile;
};

//구글 로그인
exports.googleLogin = async (ctx) => {
  const {
    token
  } = ctx.request.body;

  const url =
    "https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=" + token;

  try {

    const res = await axios.get(url);
    console.log(res);

    const account = await Account.socialLogin(res.data);

    let token = await account.generateToken();
    
    ctx.body = {
      id: account.id,
      token: token,
      thumbnail: account.profile.thumbnail,
      username: account.profile.username,
    };

  } catch (error) {

    ctx.status = 500;
  }

};

// 이메일 / 아이디 존재유무 확인
exports.exists = async (ctx) => {
  const {
    key,
    value
  } = ctx.params;
  let account = null;

  try {
    // key 에 따라 findByEmail 혹은 findByUsername 을 실행합니다.
    account = await (key === "email" ?
      Account.findByEmail(value) :
      Account.findByUsername(value));
  } catch (e) {
    ctx.throw(500, e);
  }

  ctx.body = {
    exists: account !== null,
  };
};
// 로그아웃
exports.logout = async (ctx) => {
  ctx.body = "logout";
};