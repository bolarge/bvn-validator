/**
 * Created by nonami on 24/04/2018.
 */
const bvnSchema = {
  'REGISTRATION DATE':'registrationDate',
  'FIRST NAME':'firstName',
  'MIDDLE NAME':'middleName',
  'LAST NAME':'lastName',
  'BIRTH DATE':'dob',
  'PHONE':'phoneNumber',
  'NIN':'nin',
  'ENROLLMENT BRANCH':'enrollmentBranch',
  'ENROLLMENT INSTITUTION':'enrollmentInstitution',
};

const ninSchema = {
  'FIRST NAME': 'firstName',
  'MIDDLE NAME': 'middleName',
  'LAST NAME': 'lastName',
  'MAIDEN NAME': 'maidenName',
  'BIRTH DATE': 'dob',
  'PHONE': 'phoneNumber',
  'GENDER': 'gender',
};

module.exports.bvnSchema = bvnSchema;

module.exports.ninSchema = ninSchema;