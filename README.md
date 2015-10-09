# BVN validation node package

*To install:* 

```sh
$ git clone git+ssh://git@bitbucket.org:kvpafrica/nibssssm.git bvn
```

## Generate Key Pairs

```javascript
bvn.generateKey("username","password")
.then(function(res){
    // Result
},function(err){
    // Error
});
```

> You can get your generated private and public keys in "node_modules/nibssSSM/keys/" Folder

## Validate a BVN

> You will pass a json object to the bvn validateBVN function. eg : 

```javascript

var inputDataObject = {
  BVN : "33333333333",
  FirstName : "Damilola",
  LastName : "Foo",
  PhoneNumber : "08098776765",
  DateOfBirth : "29-OCT-1977"
};

bvn.validateBVN(inputDataObject)
.then(function(res){
    // Result
},function(err){
    // Error
});
```

>Output format:

```javascript

{ ValidationResponse:
   { RequestStatus: [ '00' ],
     BVN: [ '33333333333' ],
     Validity: [ 'INVALID' ]
 } 
}
```

*Note: Always generate a key on first use.*