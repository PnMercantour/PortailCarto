var app = angular.module('PortailApp', [
  'ngRoute',
  'angular-toArrayFilter'
]);

/*
 * Configuration de la table de routage de l'app
 */

app.config(['$routeProvider', '$sceDelegateProvider',
  function ($routeProvider, $sceDelegateProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'templates/home.htm',
        controller: 'ListMapController'
          //controller: 'homeCtrl'
      })
      .when('/:mapsId', {
        templateUrl: 'templates/view_map-detail.htm',
        controller: 'DetailMapController'
          //controller: 'mapCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });

    $sceDelegateProvider.resourceUrlWhitelist([
      'self',
      'https://*.youtube.com/**'
    ]);
  }
]);