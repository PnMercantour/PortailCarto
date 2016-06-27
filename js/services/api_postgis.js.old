/*
 *CRÉATION DU SERVICE DE CONNEXION À LA BDD
 */

app.service('api_postgis', function($http){
	var service = this;
	var baseUrl = 'postgis_geojson.php'; //appel le fichier PHP permettant de se connecter à la BDD
	service.getJsonLayer = function(couche, fields, srid, geomfield) {
		var params = {
			"geotable": couche,
			"fields": (fields ? fields.join(',') : null),
			"srid": srid || "4326",
			"geomfield": geomfield || "geom"
		}
		return $http.get(baseUrl, {params: params});
	};
})
