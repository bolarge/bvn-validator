var chai = require('chai');
var path = require('path');
var chaiAsPromised = require("chai-as-promised");
var should = chai.should();
var ssm = require("../");
var encryptedData = "";

chai.use(chaiAsPromised);

describe('NIBSS Security Module', function () {

    describe('- Generate Key', function () {
        it('should generate key pair without error', function (done) {
            ssm.generateKey("myusername", "andapassword")
                .then(function (result) {
                    should.exist(result);
                    done();
                }, function (err) {
                    should.not.exist(err);
                    done(err);
                });
        });
    });

    describe('- Encrypt Data', function () {
        it('should Encrypt data without error', function (done) {
            ssm.encrypt("This is data", path.resolve(__dirname, '../keys') + "/public.key")
                .then(function (result) {
                    should.exist(result);
                    result.should.be.a('string');
                    encryptedData = result;
                    done();
                }, function (err) {
                    should.not.exist(err);
                    done(err);
                });
        });
    });

    describe('- Decrypt Data', function () {
        it('should decrypt data', function (done) {
            ssm.decrypt(encryptedData, "andapassword", path.resolve(__dirname, '../keys') + "/public.key")
                .then(function (result) {
                    should.exist(result);
                    result.should.be.a('string');
                    result.should.equal("This is data");
                    done();
                }, function (err) {
                    should.not.exist(err);
                    done(err);
                });
        });
    });
});