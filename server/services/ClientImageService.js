const S3 = require('aws-sdk/clients/s3');
const awsConfig = require('../../config').aws;
const MinimumImageStringLength = 20;




const s3Client = new S3(options = {
    accessKeyId: awsConfig.accessKeyId,
    secretAccessKey: awsConfig.secretAccessKey,
    region: awsConfig.region,
    sslEnabled: true,
    maxRetries: awsConfig.maxRetries,
});



module.exports.validateImage = (imgString, imageidentifier,imgType, result) => {


        if (!imgString) {
            reject ='Image must contain a value.';
            return  reject;
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

        var date = new Date();
        var FullPathToFile = 'Pictures'.concat('/',imgType,'/', date.getFullYear(), '/', date.getMonth(), '/', date.getDate(), '/', imageidentifier, '.', FileExtension);


        var Type = 'image/'.concat(FileExtension);

        const base64Data = MainImageString.replace(/^data:image\/\w+;base64,/, "")
        let ImageBuffer = Buffer.from(base64Data, 'base64');

        let opts = {

            Body: ImageBuffer,
            Bucket: awsConfig.pictureS3Bucket,
            Key: FullPathToFile,
            ContentType: Type,
            ACL: 'public-read',
            ContentEncoding: 'base64',
            Tagging: `lastName=${result.lastName}&firstName=${result.firstName}&uniqueNumber=${imageidentifier}`  // "key1=value1&key2=value2"
        }

        return SaveToAmazonBucket(opts);    
}


const SaveToAmazonBucket = (options) => {

        return s3Client.upload(options).promise();

}


module.exports.retrieveImageFromAmazon = (pathtoImage) => {


    let opts = {

        Bucket: awsConfig.pictureS3Bucket,
        Key: pathtoImage.img,

    }

    return getObjectFromS3(opts).then((response) => {
        return { response: `data:${response.ContentType};base64,${response.Body.toString('base64')}` };
    });

}


const getObjectFromS3 = (options) => {

    return s3Client.getObject(options).promise();

}


