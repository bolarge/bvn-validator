/**
 * Created by temi on 12/07/2016.
 */

const ErrorList = {
    INVALID_ACCOUNT_NUMBER: 'Account number should be 10 digits!',
    INVALID_BVN: 'BVN should be 11 digits!',
    BVN_MISMATCH: 'BVNs do not match!',
    BVN_NOT_FOUND: 'Specified BVN not found',
    NAME_MISMATCH: 'Names do not match!',
    RESULT_NOT_FOUND: 'Result not found.',
    INVALID_RESULT: 'No valid result returned.',
    RECORD_NOT_FOUND: 'Record Not Found'
};

module.exports = ErrorList;
