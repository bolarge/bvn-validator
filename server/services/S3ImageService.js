const S3 = require('aws-sdk/clients/s3');
const awsConfig = require('../../config').aws;
const MinimumImageStringLength = 20;


const s3Client = new S3(options = {

    region: awsConfig.region,

});


module.exports.saveToS3 = (imgString, imageidentifier, imgType) => {


    if (!imgString) {
        throw new Error('Image must contain a value.');
    }

    var MainImageString = imgString;

    if (MainImageString.length <= MinimumImageStringLength) {
        throw new Error('Image length is too small.');
    }

    var Base64ImagePattern = new RegExp("data:image\/([a-zA-Z]*);base64,([^\"]*)");

    var IsImageFromRegex = Base64ImagePattern.test(MainImageString);

    if (!IsImageFromRegex) {
        throw new Error('Image not recognised');
    }


    var FileExtension = MainImageString.substring(MainImageString.indexOf('/') + 1, MainImageString.indexOf(';base64'));

    var FullPathToFile = 'Pictures'.concat('/', imgType, '/', imageidentifier, '.', FileExtension);


    var Type = 'image/'.concat(FileExtension);

    const base64Data = MainImageString.replace(/^data:image\/\w+;base64,/, "");
    let ImageBuffer = Buffer.from(base64Data, 'base64');

    let opts = {

        Body: ImageBuffer,
        Bucket: awsConfig.pictureS3Bucket,
        Key: FullPathToFile,
        ContentType: Type,
        ContentEncoding: 'base64'
    };

    return SaveToAmazonBucket(opts);
};


const SaveToAmazonBucket = (options) => {

    return s3Client.upload(options).promise();

};


module.exports.retrieveImageFromS3 = (pathtoImage) => {


    let opts = {

        Bucket: awsConfig.pictureS3Bucket,
        Key: pathtoImage.img,

    };

    return getObjectFromS3(opts).then((response) => {
        return {response: `data:${response.ContentType};base64,${response.Body.toString('base64')}`};
    });

};


const getObjectFromS3 = (options) => {

    return s3Client.getObject(options).promise();

};


