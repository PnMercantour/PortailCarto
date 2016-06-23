var app = angular.module('PortailApp', [
	'ngRoute',
	'angular-toArrayFilter'
]);

/*
 * Configuration de la table de routage de l'app
 */

app.config(['$routeProvider',
	function($routeProvider){
	$routeProvider
		.when('/', {
			templateUrl:'templates/home.htm',
			controller: 'ListMapController'
			//controller: 'homeCtrl'
		})
		.when('/:mapsId', {
			templateUrl:'templates/view_map-detail.htm',
			controller: 'DetailMapController'
			//controller: 'mapCtrl'
		})
		.otherwise({
			redirectTo: '/'
		});
}]);
