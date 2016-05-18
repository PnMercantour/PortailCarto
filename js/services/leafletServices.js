app = angular.module('mapServices');

/*
 * CRÉATION DU SERVICE LEAFLET pour config des couches de bases
 */

app.factory('leafletServices', ['$http', function($http) {
	return {
		layer : {},

		loadData : function(layerdata) {
			this.layer = {};
			this.layer.id = layerdata.id;
			this.layer.name = layerdata.name;
			this.layer.active = layerdata.active;

			if (layerdata.type == 'xyz' || layerdata.type == 'ign') {
				if ( layerdata.type == 'ign') {
					url = 'https://gpp3-wxs.ign.fr/' + layerdata.key + '/geoportail/wmts?LAYER='+layerdata.layer+'&EXCEPTIONS=text/xml&FORMAT=image/jpeg&SERVICE=WMTS&VERSION=1.0.0&REQUEST=GetTile&STYLE=normal&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}';
				}
				else {
					url = layerdata.url;
				}
				this.layer.map = new L.TileLayer(url,layerdata.options);
			}
			else if (layerdata.type == 'wms') {
				this.layer.map = L.tileLayer.wms(layerdata.url,layerdata.options);
			}
			return this.layer;
		}
	};
}]);




/*
 * * #2 - Service cartographique
 */
app.service('mapService', function($rootScope, $routeParams, $loading, $q, $timeout, $location, configServ, dataServ, LeafletServices) {

	/*
	 * Private variables or functions
	 */

	var map;

	var geom;

	var geoms = [];

	var empriseInit;

	var zoomInit;

	var tileLayers = []; // couche pour les fonds de référence

	var currentSel;

	var currentBaseLayer = null;

	var self;

	/*
	 * Récupération de l'url de données avec getUrl de configServ
	 * Url fourni dans les contôles des base (exemple : cablesControllers.js)
	 */
	var loadMapConfig = function() {
		configServ.getUrl('data/defaultMap.json', function(res) {
			resource = res[0];
			//Chargement des fonds de référence : layers ==> baselayers définis defaultMap.json
			configServ.get('map:currentLayer', function(_curlayer){
				currentBaseLayer = _curlayer;
			});

			// Ajout des couches sur la carte
			var i = 0;
			resource.layers.baselayers.forEach(function(_layer, name){
				// Récupération des différentes propriétés pour l'affichage dans la carte et dans la légende
				var layerData = LeafletServices.loadData(_layer);
				var layerDataId = layerData.id;
				var layerDataName = layerData.name;
				var layerDataMap = layerData.map;
				var layerDataActive = layerData.active;
				tileLayers[i] = {id: layerDataId, name: layerDataName, active: layerDataActive, map: layerDataMap};

				if(currentBaseLayer){
					if(layerData.name == currentBaseLayer){
						layerData.map.addTo(map);
					}
				} else {
					if(layerData.active){
						layerData.map.addTo(map);
						currentBaseLayer = layerData.map;
					}
				}
				i++;
			});

			// Vue par défaut de la carte
			empriseInit = [resource.center.lat, resource.center.lng];
			zoomInit = resource.center.zoom;

			// Vue au premier chargement de l'appli
			map.setView(empriseInit, zoomInit);
		});
	};

	/*
	 * Ajout des controls (zoom, scale, etc.) à la carte.
	 */
	var addControls = function() {

		// Ajout d'un panneau de type sidebar pour contenir la légende
		var sidebar = L.control.sidebar('legendblock', {
			closeButton: true,
			position: 'left'
		});
		map.addControl(sidebar);

		// bouton pour revenir à l'emprise de départ
		L.easyButton({
			position:"topright",
			states: [{
				icon: 'glyphicon glyphicon-home',
				title: 'Emprise initiale',
				onClick: function(control) {
					map.setView(empriseInit, zoomInit);
				}
			}]
		}).addTo(map);

		/*
		 * GESTION LEGENDE
		 */

		// Légende Leaflet
		layerControl = L.control.layers(tileLayers, null, { collapsed: false});

		// Ajout de la légende Leaflet sur la carte
		layerControl.addTo(map);
		// Suppression du conteneur de la légande Leaflet par défaut
		layerControl._container.remove();
		// Mise en place des couches dans la légende personnalisée : voir template-url ==> map.htm
		// document.getElementById('baselayers').appendChild(layerControl.onAdd(map));

		/*
		 * FIN GESTION LEGENDE
		 */

		//Ajout d'une l'échelle
		L.control.scale().addTo(map);
	};
