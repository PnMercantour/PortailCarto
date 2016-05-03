var app = angular.module('PortailApp', ['ngRoute']);

/*
 * Configuration des routes
 */

app.config(function($routeProvider){
    $routeProvider
        .when('/', {
            controller: 'mapCrtl'
        })
        .otherwise({
        	redirectTo: '/'
        });
});
