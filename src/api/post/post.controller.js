const Joi = require("joi");
const {
    Types: {
        ObjectId
    },
} = require("mongoose");

const Post = require("../../models/post");


//포스트 모두 가져오기
exports.list = async (ctx) => {

    let post = null;

    try {

        post = await Post.findAll();
    } catch (error) {
        ctx.status = 400;
    }

    let list = post.map((data, index) => {

        return {
            profile: data.user.profile,
            title: data.title,
            content: data.content,
            images: data.image,
            createdAt: data.createdAt,
        };
    })

    ctx.body = list;

}

exports.readPageAndQuery = async (ctx) => {
    const {
        page,
        size
    } = ctx.request.query;

    const {
        query
    } = ctx.params;

    try {
        let res = await Post.findByPageAndQuery(query, page, size);

        const content = res.content.map((post, index) => {
            return {
              postNum: post.postId,
              postId: post._id,
              profile: post.user.profile,
              title: post.title,
              content: post.content,
              //image: post.image,
              //reply: post.reply,
              createdAt: post.createdAt,
              view: post.view,
              like: post.like.length,
            };
        });

        res = {
            ...res,
            content: content,
        };

        ctx.body = res;
    } catch (error) {
        console.log(error);
        ctx.status = 500;
        return;
    }
}

//작성자 + 페이지로 읽어오기
exports.readPageAndUser = async (ctx) => {
    const {
        page,
        size
    } = ctx.request.query;

    const { userId } = ctx.params;

    try {
        let res = await Post.findByPageAndUser(userId, page, size);

        const content = res.content.map((post, index) => {
            return {
                postNum: post.postId,
                title: post.title,
                createdAt: post.createdAt,
                view: post.view,
                like: post.like.length,
            };
        });

        res = {
            ...res,
            content: content,
        };

        ctx.body = res;
    } catch (error) {
        console.log(error);
        ctx.status = 500;
        return;
    }
}

//페이지로 읽어오기
exports.readPage = async (ctx) => {
    const {
        page,
        size
    } = ctx.request.query;

    let res = null;

    try {
        res = await Post.findByPage(page, size);

        const data = res.content.map((post, index) => {
            return {
                postNum: post.postId,
                postId: post._id,
                profile: post.user.profile,
                title: post.title,
                content: post.content,
                //image: post.image,
                //reply: post.reply,
                createdAt: post.createdAt,
                view: post.view,
                like: post.like.length,
            };
        });

        res = {
            ...res,
            content: data
        }
    } catch (error) {
        console.log(error)
        ctx.status = 500;
    }

    return ctx.body = res;

}

//게시물 하나 읽어오기
exports.read = async (ctx) => {

    const {
        id
    } = ctx.params;

    let post = null;

    try {

        post = await Post.findBypostNum(id);
    } catch (error) {
        console.log(error)
        ctx.status = 400;
    }

    const reply = post.reply.map((data, index) => {
        return {
            profile: data.user.profile,
            content: data.content,
            createdAt: data.createdAt,
            id: data._id
        };
    })

    const res = {
        postNum: post.postId,
        postId: post._id,
        profile: post.user.profile,
        title: post.title,
        content: post.content,
        image: post.image,
        reply: reply,
        view: post.view,
        createdAt: post.createdAt,
        like: post.like.length,
    };

    ctx.body = res;
}

//포스트 생성
exports.create = async (ctx) => {

    //로그인 검사
    const {
        user,
    } = ctx.request;
    if (!user) {
        ctx.status = 403;
        return;
    }

    // 데이터 검증
    const schema = Joi.object().keys({

        title: Joi.string().min(4).max(15).required(),

        content: Joi.string().min(1).max(500).required(),
        file: Joi.array().max(5)
    });

    const result = schema.validate(ctx.request.body);

    // 스키마 검증 실패
    if (result.error) {
        ctx.status = 400;
        return;
    }

    let post = null;


    let files = [];
    //파일이 하나만 들어오면 객체로 들어오고, 2개 이상이면 배열로 들어온다.
    if (ctx.request.files.fileList instanceof Array) {
        files = [...ctx.request.files.fileList];
    } else if (ctx.request.files.fileList === undefined) {
        files = [];
    } else {
        files = [ctx.request.files.fileList];
    }

    try {
        post = await Post.createPost({
            title: ctx.request.body.title,
            content: ctx.request.body.content,
            user: user._id,
            files: files,
        });
    } catch (e) {
        ctx.throw(500, e);
    }

    ctx.body = {
        data: "data"
    };
}

//포스트 삭제
exports.delete = async (ctx) => {

    //로그인 검사
    // const {
    //     user
    // } = ctx.request;
    // if (user === null) ctx.status = 403;

    const {
        id
    } = ctx.params;

    console.log(id);

    try {

        const res = await Post.deletePost(id);

    } catch (error) {

        console.log(error)

    }

    ctx.status = 200;

}

//댓글 생성
exports.createReply = async (ctx) => {

    //로그인 검사
    const {
        user
    } = ctx.request;
    const {
        id
    } = ctx.params
    const {
        content
    } = ctx.request.body;
    console.log(user);

    if (user === undefined || user === null) {
        ctx.status = 403;
        return;
    }

    try {
        res = await Post.createReply(id, user._id, content);
        ctx.status = 201;
    } catch (error) {
        console.log(error)
        ctx.status = 500;
    }
}

//댓글 삭제
exports.deleteReply = async (ctx) => {
    //로그인 검사
    const {
        user
    } = ctx.request;

    const {
        id,
        replyId
    } = ctx.params;

    try {
        res = await Post.deleteReply(replyId, id, 111);
        ctx.status = 201;
    } catch (error) {
        console.log(error);
        ctx.status = 500;
    }
}


//좋아요
exports.likePost = async (ctx) => {
    //로그인 검사
    const {
        user
    } = ctx.request;

    console.log(user);

    if (user === undefined || user === null) {
        ctx.status = 403;
        return;
    }

    const {
        id
    } = ctx.params;

    try {
        res = await Post.likePost(user._id, id);
        ctx.status = 200;
    } catch (error) {
        ctx.status = 400;
    }
}