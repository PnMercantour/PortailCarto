/*
 *CRÉATION DU SERVICE DE CONNEXION À LA BDD
 */

app.service('api_postgis', function($http){
	var service = this;
	var baseUrl = 'postgis_geojson.php';
	service.getJsonLayer = function(couche, fields, srid, geomfield) {
		var params = {
			"geotable": couche,
			"fields": (fields ? fields.join(',') : null), // Cet opérateur ternaire permet de ne pas avoir
														  //à charger tout le temps un champ
			"srid": srid || "4326",
			"geomfield": geomfield || "geom"
		}
		return $http.get(baseUrl, {params: params});
	};
})
