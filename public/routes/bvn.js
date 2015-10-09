'use strict';

angular.module('mean.bvn').config(['$stateProvider',
  function($stateProvider) {
    $stateProvider.state('bvn example page', {
      url: '/bvn/example',
      templateUrl: 'bvn/views/index.html'
    });
  }
]);
