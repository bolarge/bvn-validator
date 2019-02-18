const S3 = require('aws-sdk/clients/s3');
const awsConfig = require('../../config').aws;
const MinimumImageStringLength = 20;
const Utils = require('../../server/services/Utils');


const s3Client = new S3(options = {

    region: awsConfig.region

});


module.exports.saveToS3 = (imgString, imageIdentifier) => {


    if (!imgString) {
        throw new Error('Image must contain a value.');
    }

    //const MainImageString = imgString;

    if (imgString.length <= MinimumImageStringLength) {
        throw new Error('Image length is too small.');
    }

    const base64ImagePattern = new RegExp("data:image\/([a-zA-Z]*);base64,([^\"]*)");

    const isImageFromRegex = base64ImagePattern.test(imgString);

    if (!isImageFromRegex) {
        throw new Error('Image not recognised');
    }


    const fileExtension = imgString.substring(imgString.indexOf('/') + 1, imgString.indexOf(';base64'));

    const newPath = Utils.randomString(40, imageIdentifier);

    const fullPathToFile = 'Pictures'.concat('/', newPath, '.', fileExtension);


    const contentType = 'image/'.concat(fileExtension);

    const base64Data = imgString.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Buffer.from(base64Data, 'base64');

    let opts = {

        Body: imageBuffer,
        Bucket: awsConfig.pictureS3Bucket,
        Key: fullPathToFile,
        ContentType: contentType,
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
        Key: pathtoImage.imgPath,

    };

    return getObjectFromS3(opts).then((response) => {
        return {response: `data:${response.ContentType};base64,${response.Body.toString(response.ContentEncoding)}`};
    });

};


const getObjectFromS3 = (options) => {

    return s3Client.getObject(options).promise();

};


