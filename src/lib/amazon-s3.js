var AWS = require("aws-sdk");
const fs = require("fs");

const s3 = new AWS.S3({
  accessKeyId: "AKIAZDM64FMQNSX6TMIA", // 사용자의 AccessKey
  secretAccessKey: "rYQPMpzjyX17P6JQXPWmh8gc0fa87C4EbGYINKY+", // 사용자의 secretAccessKey
});

const bucket_name = "jsks3test"; // 생성한 버킷 이름

//file은 멀티파트 파일을 받아온다.
const uploadPostImage = async (files) => {
  //console.log(file.filepath);
  //console.log();
  const d = new Date();

  const images = await Promise.all(
    files.map(async (file, index) => {
      let time = d.getTime();
      let filename = time + file.originalFilename;

      const params = {
        Bucket: bucket_name,
        Key: filename, // file name that you want to save in s3 bucket
        Body: fs.readFileSync(file.filepath),
      };

      let result = await s3.upload(params).promise();
      return {
        filename: filename,
        src: result.Location,
      };
    })
  );

  return images;
};

const deletePostImage = async (fileName) => {

  const params = {
    Bucket: bucket_name,
    Key: fileName, // file name that you want to save in s3 bucket
  };

  const res = await s3.deleteObject(params).promise();

  return res;

}
const uploadThumbNailImage = async (file) => {

  const d = new Date();

  let time = d.getTime();
  let filename = "thumbnail/" + time + file.originalFilename;

  const params = {
    Bucket: bucket_name,
    Key: filename, // file name that you want to save in s3 bucket
    Body: fs.readFileSync(file.filepath),
  };

  let result = await s3.upload(params).promise();

  return result;
}

const updateThumbNailImage = async (newfile, src) => {

  if (src !== process.env.DEFAULT_THUMBNAIL) {
    let string = "https://jsks3test.s3.ap-northeast-2.amazonaws.com/";

    src = src.substring(string.length);
    const params = {
      Bucket: bucket_name,
      Key: fileName, // file name that you want to save in s3 bucket
    };

    await s3.deleteObject(params).promise();

  }

  const res = await uploadThumbNailImage(newfile);

  return res;

}
exports.uploadThumbNailImage = uploadThumbNailImage;
exports.updateThumbNailImage = updateThumbNailImage;
exports.deletePostImage = deletePostImage;
exports.uploadPostImage = uploadPostImage;