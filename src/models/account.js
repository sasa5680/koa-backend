const mongoose = require("mongoose");
const {
  Schema
} = mongoose;

const s3 = require("../lib/amazon-s3");
const crypto = require("crypto");
const {
  generateToken
} = require("../lib/token");
const {
  resourceLimits
} = require("worker_threads");


const generateRandomString = (num) => {
  const characters ='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%';
  let result = '';
  const charactersLength = characters.length;
  for (let i = 0; i < num; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
}

function hash(password) {
  return crypto
    .createHmac("sha256", process.env.SECRET_KEY)
    .update(password)
    .digest("hex");
}

const Profile = new Schema({
  username: String,
  thumbnail: {
    type: String,
    default: "/static/images/default_thumbnail.png",
  },
});


const Account = new Schema({
  contact: {
    email: {
      type: String,
      default: "",
    },
    facebook: {
      type: String,
      default: "",
    },
    twitter: {
      type: String,
      default: "",
    },
  },

  profile: {
    username: String,
    thumbnail: {
      type: String,
      default: process.env.DEFAULT_THUMBNAIL,
    },
  },
  email: {
    type: String,
  },

  facebook: {
    type: String,
  },

  twitter: {
    type: String,
  },
  // 소셜 계정으로 회원가입을 할 경우에는 각 서비스에서 제공되는 id 와 accessToken 을 저장합니다
  social: {
    facebook: {
      id: String,
      accessToken: String,
    },
    google: {
      id: String,
      accessToken: String,
    },
  },

  password: String, // 로컬계정의 경우엔 비밀번호를 해싱해서 저장합니다
  role: {
    type: String,
    default: "user",
  },

  intro: {
    type: String,
    default: "",
  },

  thoughtCount: {
    type: Number,
    default: 0,
  }, // 서비스에서 포스트를 작성 할 때마다 1씩 올라갑니다
  createdAt: {
    type: Date,
    default: Date.now,
  }, //생성일
});

Account.methods.generateToken = function () {
  // JWT 에 담을 내용
  const payload = {
    _id: this._id,
    profile: this.profile,
  };

  return generateToken(payload, "account");
};

Account.statics.findByUsername = function (username) {
  // 객체에 내장되어있는 값을 사용 할 때는 객체명.키 이런식으로 쿼리하면 됩니다
  return this.findOne({
    "profile.username": username
  }).exec();
};

Account.statics.findByEmail = function (email) {
  return this.findOne({
    email
  }).exec();
};

Account.statics.findByEmailOrUsername = function ({
  username,
  email
}) {
  return this.findOne({
    // $or 연산자를 통해 둘중에 하나를 만족하는 데이터를 찾습니다
    $or: [{
      "profile.username": username
    }, {
      email
    }],
  }).exec();
};

Account.statics.localRegister = async function ({
  username,
  email,
  password,
  thumbnail,
}) {

  console.log(thumbnail);
  // 데이터를 생성 할 때는 new this() 를 사용합니다.

  let src = process.env.DEFAULT_THUMBNAIL;

  if (!(thumbnail === null || thumbnail === undefined)) {
    const res = await s3.uploadThumbNailImage(thumbnail);
    src = res.Location;
  }

  console.log(src);
  const account = new this({
    profile: {
      username,
      thumbnail: src,
      // thumbnail 값을 설정하지 않으면 기본값으로 설정됩니다.
    },
    email,
    password: hash(password),
  });

  return account.save();
};

Account.statics.socialLogin = async function ({email, name}) {

  const user = await this.findOne({
    email,
  }).exec();

  if (user === null || user === undefined) {

    const password = generateRandomString(15);

    const account = new this({
      profile: {
        username: name,
        // thumbnail 값을 설정하지 않으면 기본값으로 설정됩니다.
      },
      email,
      password: hash(password),
    });

    return account.save();
  } else {
    return user;
  }
}

Account.statics.updateUser = async function (username, body, thumbnail) {

  const user = await this.findOne({
    "profile.username": username
  }).exec();

  if (!(thumbnail === null || thumbnail === undefined)) {
    const res = await s3.updateThumbNailImage(thumbnail, user.profile.thumbnail);
    let src = res.Location;

    user.profile.thumbnail = src;
  }

  user.contact.email = body.email;
  user.contact.twitter = body.twitter;
  user.contact.facebook = body.facebook;
  user.intro = body.intro;

  return user.save();

};


Account.methods.validatePassword = function (password) {
  // 함수로 전달받은 password 의 해시값과, 데이터에 담겨있는 해시값과 비교를 합니다.
  const hashed = hash(password);
  return this.password === hashed;
};

//autoIdSetter(Account, mongoose, "account", "id");
module.exports = mongoose.model("Account", Account);