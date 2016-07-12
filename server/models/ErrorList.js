/**
 * Created by temi on 12/07/2016.
 */

var ErrorList = {
    MISSING_FIELDS: {
        code: 100,
        message: 'One or more required fields missing!'
    },
    INVALID_ACCOUNT_NUMBER: {
        code: 101,
        message: 'Account number should be 10 digits!'
    },
    INVALID_BVN: {
        code: 102,
        message: 'BVN should be 11 digits!'
    },
    BVN_MISMATCH: {
        code: 103,
        message: 'BVNs do not match!'
    },
    NAME_MISMATCH: {
        code: 104,
        message: 'Names do not match!'
    }
};


module.exports = ErrorList;