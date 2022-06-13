const {
  date
} = require("joi");
const autoIdSetter = require("../lib/auto-id-setter");
const s3 = require("../lib/amazon-s3");

let Account = require("../models/account");

const mongoose = require("mongoose");
const {
  Schema
} = mongoose;


//댓글
const Reply = new Schema({

  //작성자 프로필
  user: {
    type: Schema.Types.ObjectId,
    ref: "Account",
    required: true,
  },

  content: String, //댓글 내용
  createdAt: {
    type: Date,
    default: Date.now,
  }, //생성일
});

//게시물 이미지
const Image = new Schema({
  src: String, //소스 src
  filename: String, //원본 파일 이름
});

//게시물
const Post = new Schema({

  //작성자 프로필
  user: {
    type: Schema.Types.ObjectId,
    ref: 'Account',
    required: true
  },

  title: String, //제목
  content: String, //내용
  createdAt: {
    type: Date,
    default: Date.now,
  }, //생성일

  view: {
    type: Number,
    default: 0,
  },
  image: [Image], //게시물 이미지들
  reply: [Reply], //게시물 댓글들
  like: [] // 좋아요 누른 유저들
});


autoIdSetter(Post, mongoose, "post", "postId");
autoIdSetter(Image, mongoose, "postImage", "imageId");
autoIdSetter(Reply, mongoose, "postReply", "replyId");

//게시물 생성
Post.statics.createPost = async function ({
  title,
  content,
  user, //유저 id,
  files,
}) {
  // 데이터를 생성 할 때는 new this() 를 사용합니다.

  let images = await s3.uploadPostImage(files);

  const post = new this({
    image: images,
    reply: [],
    title: title,
    content: content,
    user: user,
  });

  return post.save();
};

//게시물 삭제
Post.statics.deletePost = async function (
  postnum
) {

  const post = await this.findOne({
    postId: postnum,
  }).exec();

  //이미지들 S3에서 삭제
  post.image.map((data, index) => {
    console.log(data);
    s3.deletePostImage(data.filename);
  })

  //post 삭제
  await post.remove().exec();
}

//전부 가져오기
Post.statics.findAll = function () {
  return this.find().populate("user").exec();
}

//post num을 기준으로 게시물을 한개 가져온다.
Post.statics.findBypostNum = async function (postId) {

  const post = await this.findOne({
      postId: postId,
    })
    .populate("user")
    .populate("reply.user")
    .exec();

  console.log(post)

  //조회수 추가
  post.view = post.view + 1;

  await post.save();

  return post;
};

//페이지로 찾아온다.
Post.statics.findByPage = async function (page, size) {

  if (page <= 0) throw error("페이지는 0이상이어야 합니다.");
  if (size <= 0) throw error("요소의 크기는 0이상이어야 합니다.");

  //마지막 여부
  //페이지 수
  const total = await this.countDocuments({}).exec();

  const totalPages = Math.ceil(total / size);

  const isLast = (page >= totalPages);

  //페이지에 해당하는 게시물들을 가져온다.
  const posts = await this.find()
    .skip((page - 1) * size)
    .limit(size)
    .populate("user")
    .exec();

  return {
    content: posts,
    last: isLast,
    totalPages: totalPages,
    page: page,
  }

};

//페이지 + 작성자로 가져오기
Post.statics.findByPageAndUser = async function (userId, page, size) {
  //마지막 여부
  //페이지 수
  if (page <= 0) throw error("페이지는 0이상이어야 합니다.");
  if (size <= 0) throw error("요소의 크기는 0이상이어야 합니다.");

  const total = await this.where({
    "user": userId
  }).countDocuments({}).exec();

  const totalPages = Math.ceil(total / size);

  const isLast = page >= totalPages;

  //페이지에 해당하는 게시물들을 가져온다.
  const posts = await this.find({
      "user": userId
    })
    .skip((page - 1) * size)
    .limit(size)
    //.populate("user")
    .exec();
  
  return {
    content: posts,
    last: isLast,
    totalPages: totalPages,
    page: page,
  };
};

//페이지 + 검색어로 가져오기
Post.statics.findByPageAndQuery = async function (query, page, size) {
  if (page <= 0) throw error("페이지는 0이상이어야 합니다.");
  if (size <= 0) throw error("요소의 크기는 0이상이어야 합니다.");

  console.log(query)

  const regex = new RegExp(query, 'i'); // i for case insensitive

  const total = await this.where({
      $or: [{
          title: {
            $regex: regex,
          },
        },
        {
          content: {
            $regex: regex,
          },
        },
      ],
    })
    .countDocuments({})
    .exec();

  const totalPages = Math.ceil(total / size);

  const isLast = page >= totalPages;

  const posts = await this.find({
      $or: [{
          title: {
            $regex: regex,
          },
        },
        {
          content: {
            $regex: regex,
          },
        },
      ],
    })
    .skip((page - 1) * size)
    .limit(size)
    .populate("user")
    .exec();


  return {
    content: posts,
    last: isLast,
    totalPages: totalPages,
    page: page,
  };
};


//댓글 생성
Post.statics.createReply = async function (postId, userId, content) {

  const res = await this.findOneAndUpdate({
    postId: postId,
  }, {
    $push: {
      reply: {
        content: content,
        user: userId
      }
    },
  }).exec();
};

//댓글 삭제
Post.statics.deleteReply = async function (replyId, postnum, userId) {
  console.log(replyId);
  console.log(postnum);

  await this.findOneAndUpdate({
    postId: postnum,
  }, {
    $pull: {
      reply: {
        _id: replyId
      },
    },
  }).exec();


};

Post.statics.likePost = async function (userId, postId) {

  //이미 좋아요를 눌렀는지 체크한다.
  const res = await this.find({
    postId: postId,
    like: userId
  }).exec();

  if (!(Array.isArray(res) && res.length === 0)) {
    throw new Error("이미 좋아요를 눌렀습니다.");
  }

  this.findOneAndUpdate({
    postId: postId,
  }, {
    $push: {
      like: userId
    },
  }).exec();
};

// 스키마를 모델로 변환하여, 내보내기 합니다.
module.exports = mongoose.model("Post", Post);