# NIBSS Security Module
*node version*

```sh
$ npm install git+ssh://git@bitbucket.org:kvpafrica/nibssssm.git --save
```

## Require the module

```javascript
var ssm = require("nibssSSM");
```

## Generate Key Pairs

```javascript
ssm.generateKey("username","password")
.then(function(res){
    // Result
},function(err){
    // Error
});
```

> You can get your generated private and public keys in "node_modules/nibssSSM/keys/" Folder

## Encrypt Data

```javascript
ssm.encrypt("Data","../publicKey/Path")
.then(function(res){
    // Result
},function(err){
    // Error
});
```

## Decrypt Data

```javascript
ssm.decrypt("data","password","../publicKey/Path");
.then(function(res){
    // Result
},function(err){
    // Error
});
```

*Note: Always generate a key on first use.*

## Run Test Suit

```sh
$ npm test
```