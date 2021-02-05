const aws = require('aws-sdk');
const fs = require('fs');

const { AWS_KEY, AWS_SECRET } =
    process.env.NODE_ENV == 'production'
        ? process.env
        : require('../secrets.json');

const s3 = new aws.S3({
    accessKeyId: AWS_KEY,
    secretAccessKey: AWS_SECRET,
});

exports.upload = (req, res, next) => {
    const { filename, path, mimetype, size } = req.file;

    s3.putObject({
        Bucket: 'julians-imageboard',
        ACL: 'public-read',
        Key: filename,
        Body: fs.createReadStream(path),
        ContentType: mimetype,
        ContentLength: size,
    })
        .promise()
        .then(() => {
            next();
            fs.unlink(path, () => {});
        })
        .catch(e => {
            res.status(500).send(e.message);
        });
};
