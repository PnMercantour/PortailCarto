app.factory('MapsServices', ['$http', 'filterFilter', '$q', function($http, filterFilter, $q) {
	return {
		maps:{},

	loadData : function() {
		self = this;

		var deferred = $q.defer();
		$http.get('data/maps.json')
			.then(
				function(results) {
				self.maps = results.data;
				deferred.resolve();
			},
			function(errors) {
				deferred.reject(errors);
			},
			function(updates) {
				deferred.update(updates);
			});
			return deferred.promise;
		},

	getAll: function() {
		this.loadData();
		return this.maps;
	},

	getFirst: function() {
		return this.maps[0];
	},

	getOne: function(sname) {
		return  filterFilter(this.maps, {id:sname})[0];
	},


	};
}]);


app.factory('baselayersServices', ['$http', function($http) {
	return {
		layer : {},

		loadData : function(layerdata) {
			this.layer = {};
			this.layer.name = layerdata.name;
			this.layer.active = layerdata.active;

			if (layerdata.type === 'xyz' || layerdata.type === 'ign') {
				if ( layerdata.type === 'ign') {
					url = 'https://gpp3-wxs.ign.fr/'+layerdata.key+'/geoportail/wmts?LAYER='+layerdata.layer+'&EXCEPTIONS=text/xml&FORMAT='+layerdata.format+'&SERVICE=WMTS&VERSION=1.0.0&REQUEST=GetTile&STYLE='+layerdata.style+'&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}';
				}
				else {
					url = layerdata.url;
				}
					this.layer.map = new L.TileLayer(url,layerdata.options);
				}
			else if (layerdata.type === 'wms') {
				this.layer.map = L.tileLayer.wms(layerdata.url,layerdata.options);
			}
			return this.layer;
		}
	};
}]);


app.factory('overlaysServices', ['$http', function($http) {

	return {
		overlays : {},

		firstLoadOverlays : function(value) {
			var layerscontrol = [];
			var lgeojson = new L.geoJson();
			var feature_group = new L.featureGroup([]);
			this.overlays = {};
			this.overlays.name = value.name;
			this.overlays.active = value.active;

			if (value.type === 'geojson' && value.active === true) {
					$http.get('postgis_geojson.php?fields='+value.fields+'&geomfield='+value.champ_geom+
						'&geotable='+value.table+'&srid=4326'//,
						//{cache:true} // ==> Avec activation du cache de cette manière,
						//bug "TypeError: Cannot read property min of undefined"... A creuser donc !
						)
					.then(
						function(results) {
								var lgeojson = new L.geoJson(results.data,eval("("+(value.options || {}) +")"));
								feature_group.addLayer(lgeojson);
								map.addLayer(feature_group);
						});
				}
				else if (value.type === 'geojson' && value.active === false) {
					console.log(value.name);
					layerscontrol[value.name]=feature_group;
				}
			return this.overlays;
		}
	};
}]);
