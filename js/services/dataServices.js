app.factory('MapsServices', ['$http', 'filterFilter', '$q', function($http, filterFilter, $q) {
	return {
		maps: [],

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


app.factory('overlaysServices', ['$http', '$q', function($http, $q) {
	var overlays = [];

	function loadOverlay(requested) {
		var overlay = {
			name: requested.name,
			active: requested.active
		};

		if (requested.type === 'geojson') {
			return $http.get('postgis_geojson.php?fields='+requested.fields+'&geomfield='+requested.champ_geom+
				'&geotable='+requested.table+'&srid=4326'
				)
			.then(
				function(results) {
					overlay.feature = new L.geoJson(
						results.data,
						eval("("+(requested.options || {}) +")")
					);
					overlays.push(overlay);
					return overlay;
				}
			);
		} else {
			return $q.reject('overlay is not of type geojson');
		}
	}

	function getOverlay(requested) {
		for (var i = 0; i < overlays.length; i++) {
			var ov = overlays[i];
			if (ov.id === requested.id) {
				return $q.when(ov);
			}
		}
		return loadOverlay(requested);
	}

	return {
		overlays: overlays,
		getOverlay: getOverlay
	};
}]);
