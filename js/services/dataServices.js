app.factory('MapsServices', ['$http', 'filterFilter', '$q', function ($http, filterFilter, $q) {
  return {
    maps: [],

    loadData: function () {
      var self = this;

      var deferred = $q.defer();
      $http.get('data/maps.json')
        .then(
          function (results) {
            self.maps = results.data;
            deferred.resolve();
          },
          function (errors) {
            deferred.reject(errors);
          },
          function (updates) {
            deferred.update(updates);
          });
      return deferred.promise;
    },

    getAll: function () {
      this.loadData();
      return this.maps;
    },

    getFirst: function () {
      return this.maps[0];
    },

    getOne: function (sname) {
      return filterFilter(this.maps, { id: sname })[0];
    }


  };
}]);


app.factory('baselayersServices', ['$http', function ($http) {
  return {
    layer: {},

    loadData: function (layerdata) {
      this.layer = {};
      this.layer.name = layerdata.name;
      this.layer.active = layerdata.active;
      this.layer.id = layerdata.id;

      if (layerdata.type === 'xyz' || layerdata.type === 'ign') {
        if (layerdata.type === 'ign') {
          url = 'https://gpp3-wxs.ign.fr/' + layerdata.key + '/geoportail/wmts?LAYER=' + layerdata.layer + '&EXCEPTIONS=text/xml&FORMAT=' + layerdata.format + '&SERVICE=WMTS&VERSION=1.0.0&REQUEST=GetTile&STYLE=' + layerdata.style + '&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}';
        } else {
          url = layerdata.url;
        }
        this.layer.map = new L.TileLayer(url, layerdata.options);
      } else if (layerdata.type === 'wms') {
        this.layer.map = L.tileLayer.wms(layerdata.url, layerdata.options);
      }
      return this.layer;
    }
  };
}]);


app.factory('overlaysServices', ['$http', '$q', '$rootScope', function ($http, $q, $rootScope) {
  var overlays = [];  // a cache of requested overlays
  var pointTypes = ['Point', 'MultiPoint'];

  function layerStyleEvent(ev) {
    $rootScope.$broadcast('feature:click', { originalEvent: ev, context: this });
  }

  function defaultOnEachFeature(feature, layer, infoBand) {
    if (pointTypes.indexOf(feature.geometry.type) >= 0) {
      var markerId;
      for (markerId in layer._layers) {
        var marker = layer._layers[markerId];
        marker.setOpacity(0.8);
      }

    }
    layer.on('click', layerStyleEvent, {
      layer: layer,
      infoBand: infoBand,
      feature: feature
    });
  }

  function extendOnEachFeature(options, overlay) {
    if (options && options.onEachFeature) {
      var customEachFeature = options.onEachFeature.bind({});
      options.onEachFeature = function (feature, layer) {
        customEachFeature(feature, layer);
        defaultOnEachFeature(feature, layer, overlay.infoBand);
      };
    } else {
      options.onEachFeature = function (feature, layer) {
        defaultOnEachFeature(feature, layer, overlay.infoBand);
      };
    }

    return options
  }

  function extendGeoJSONMarkers(featureData, latlng) {
    if (!featureData.properties.icon) {
      return L.marker(latlng);
    }
    var iconProperties = JSON.parse(featureData.properties.icon);
    var customIcon = new L.Icon(iconProperties);
    return new L.marker(latlng, {icon: customIcon});
  }

  function parseCustomOptions(customOptions) {
    var optionKey;
    var options = {};
    for (optionKey in customOptions) {
      options[optionKey] = eval('(' + (customOptions[optionKey] || null) + ')');
    }
    return options;
  }

  function getOptions(overlay, customOptions) {
    var options = parseCustomOptions(customOptions);
    options = extendOnEachFeature(options, overlay);

    return options;
  }

  function loadOverlay(requested) {
    var overlay = {
      id: requested.id,
      name: requested.name,
      thumbnail: requested.thumbnail || null,
      active: requested.active,
      infoBand: requested.infoBand,
      fields: requested.fields,
      group: requested.group
    };

    if (requested.type === 'geojson') {
      return $http.get('postgis_geojson.php?fields=' + requested.fields + '&geomfield=' + requested.champ_geom +
          '&geotable=' + requested.table + '&srid=4326'
        )
        .then(
          function (results) {
            var options = getOptions(overlay, requested.options);

            if (requested.cluster) {
              // If we use Clustering, GeoJSON group doesn't apply onEachFeature,
              // so we need to use it manually on each point
              options.pointToLayer = function (featureData, latlng) {
                var marker = extendGeoJSONMarkers(featureData, latlng);
                options.onEachFeature(featureData, marker);
                return marker;
              };
              var layer  = new L.geoJson(
                results.data,
                options
              );
              overlay.feature = new L.markerClusterGroup().addLayer(layer);
            } else {
              options.pointToLayer = extendGeoJSONMarkers;
              overlay.feature = new L.geoJson(
                results.data,
                options
              );
            }
            overlays.push(overlay);  // cache overlay
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
      // prefer cached overlay which have same id and fields
      if (ov.id === requested.id && ov.fields === requested.fields && ov.infoBand === requested.infoBand) {
        return $q.when(ov);
      }
    }
    return loadOverlay(requested);
  }

  return {
    overlays: overlays,
    getOverlay: getOverlay,
    pointTypes: pointTypes
  };
}]);
