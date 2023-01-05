const path = require("path");
const dotenv = require("dotenv");
const serve = require("koa-static");

if (process.env.NODE_ENV === "production") {
  dotenv.config({ path: path.join(__dirname, ".env.production") });

} else if (process.env.NODE_ENV === "development") {
  dotenv.config({ path: path.join(__dirname, ".env.development") });
} else {
  throw new Error("process.env.NODE_ENV를 설정하지 않았습니다!");
}

const Koa = require("koa");
const Router = require("koa-router");

const cors = require("@koa/cors"); //CORS 요청 허용
const koaBody = require("koa-body"); //멀티파트 요청 사용
const api = require("./api");

const { jwtMiddleware } = require("./lib/token");
const app = new Koa();
const router = new Router();

const mongoose = require("mongoose");

const bodyParser = require("koa-bodyparser");

mongoose.Promise = global.Promise; // Node 의 네이티브 Promise 사용
// mongodb 연결
console.log(process.env.MONGO_URI);
mongoose
  .connect(process.env.MONGO_URI)
  .then((response) => {
    console.log("Successfully connected to mongodb");
  })
  .catch((e) => {
    console.error(e);
  });

const port = process.env.PORT || 4000; // PORT 값이 설정되어있지 않다면 4000 을 사용합니다.

console.log(path.join(__dirname, "/static"));

app.use(serve(path.join(__dirname, "/static")));

//멀티파트 데이터 허용
app.use(
  koaBody({
    multipart: true,
  })
);

//jwt 미들웨어 적용
app.use(jwtMiddleware);

const koaOptions = {
  credentials: true,
};
app.use(cors(koaOptions)); //cors 적용

router.use("/api", api.routes()); // api 라우트를 /api 경로 하위 라우트로 설정
app.use(router.routes()).use(router.allowedMethods());

app.listen(port, () => {
  console.log("heurm server is listening to port " + port);
});
