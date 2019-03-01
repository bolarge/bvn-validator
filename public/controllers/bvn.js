'use strict';

/* jshint -W098 */
angular.module('mean.bvn').controller('BvnController', ['$scope', 'Global', 'Bvn',
    function ($scope, Global, Bvn) {
        $scope.global = Global;
        $scope.package = {
            name: 'bvn'
        };
    }
]);
