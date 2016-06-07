The BVN validation service is provided by Nibss
# BVN validation node package

*To install:* 

```sh
$ git clone git+ssh://git@bitbucket.org:kvpafrica/nibssssm.git bvn
```

## Generate Key Pairs

> To generate a key pair, post a username and password to the api. eg

```javascript
{
  "username" : "name",
  "password" : "password"
}

to
/oapi/generateKeys

```

> You can get your generated private and public keys in "node_modules/nibssSSM/keys/" Folder

## Validate a BVN

> To validate a BVN, post a json object to the api. eg : 

```javascript
{
  "inputDataObject":
    {
      "BVN" : "33333333333",
      "FirstName" : "Damilola",
      "LastName" : "Foo",
      "PhoneNumber" : "08098776765",
      "DateOfBirth" : "29-OCT-1977"
    }
    
}

to 

/oapi/bvnValidation

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