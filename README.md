The BVN validation service is provided by Nibss
# BVN validation node package

*To install:* 

```sh
$ git clone git+ssh://git@bitbucket.org:kvpafrica/nibssssm.git bvn
```

## Generate Key Pairs

> To generate a key pair, run the keytool script

```bash
node ./keytool.js -u username -p password --public-key /path/to/public-key --private-key /path/to/private-key
```

> You can get your generated private and public keys in "node_modules/nibssSSM/keys/" Folder

## Validate a BVN with NIBSS Response as Output

> To validate a BVN, post a json object to the api. eg : 

```json
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
```
to 

`/oapi/bvnValidation`


>Output format:

```jsob
{
  ValidationResponse:
   { RequestStatus: [ '00' ],
     BVN: [ '33333333333' ],
     Validity: [ 'INVALID' ]
   }
}
```

## Validate BVN with Boolean Match

> This allows you to perform Boolean match with the output being a status variable.

For POST, post the JSON object:

```
POST /oapi/validate

{
  "BVN" : "33333333333",
  "FirstName" : "Damilola",
  "LastName" : "Foo",
  "PhoneNumber" : "08098776765",
  "DateOfBirth" : "29-OCT-1977"
}
```


for GET, send the parameters as query parameters:

```
GET /oapi/validate?FirstName=Damilola&LastName=Foo&PhoneNumber=0800000&DateOfBirth=29-OCT-1977&BVN=1111111111
```

Please note for all the validation matches, BVN and at least one other parameter must be specified