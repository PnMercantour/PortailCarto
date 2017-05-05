app.controller('ListMapController', ['$scope', '$routeParams', "MapsServices",
  function ($scope, $http, MapsServices) {
    $scope.maps = MapsServices.maps;
    if (!$scope.maps.length) {
      var dfd = MapsServices.loadData();
      dfd.then(function () {
        $scope.maps = MapsServices.maps;
      });
    }
    $scope.orderProp = 'order';
  }
]);
