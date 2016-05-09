var app = angular.module('PortailApp', ['ngRoute']);

/*
 * Configuration de la table de routage de l'app
 */

app.config(['$routeProvider',
	function($routeProvider){
	$routeProvider
		.when('/', {
			templateUrl:'templates/home.html',
			controller: 'homeCtrl'
		})
		.when('/faune', {
			templateUrl:'templates/faune.html',
			controller: 'mapCtrl'
		})
		.when('/test', {
			templateUrl:'templates/test.html',
			controller: 'testCtrl'
		})
		.otherwise({
			redirectTo: '/'
		});
}]);
