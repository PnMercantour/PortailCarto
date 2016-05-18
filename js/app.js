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
			templateUrl:'templates/home.html',
			controller: 'ListMapController'
			//controller: 'homeCtrl'
		})
		.when('/:mapsId', {
			templateUrl:'templates/view_map-detail.html',
			controller: 'DetailMapController'
			//controller: 'mapCtrl'
		})
		//.when('/:mapsId', {
			//templateUrl:'templates/test.html',
			//controller: 'testCtrl'
		//})
		.otherwise({
			redirectTo: '/'
		});
}]);
