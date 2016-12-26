app.factory('MapsServices', ['$http', 'filterFilter', '$q', function ($http, filterFilter, $q) {
  return {
    maps: [],

    loadData: function () {
      self = this;

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
    },


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
  var overlays = [];
  var pointTypes = ['Point', 'MultiPoint'];

  function layerStyleEvent(ev) {
    $rootScope.$broadcast('feature:click', { originalEvent: ev, context: this });
  }

  function defaultOnEachFeature(feature, layer, infoBand) {
    if (pointTypes.indexOf(feature.geometry.type) >= 0) {
      var markerId;
      for (markerId in layer._layers) {
        var marker = layer._layers[markerId];
        marker.setOpacity(0.6);
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
      group: requested.group
    };

    if (requested.type === 'geojson') {
      return $http.get('postgis_geojson.php?fields=' + requested.fields + '&geomfield=' + requested.champ_geom +
          '&geotable=' + requested.table + '&srid=4326'
        )
        .then(
          function (results) {
            overlay.feature = new L.geoJson(
              results.data,
              getOptions(overlay, requested.options)
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
    getOverlay: getOverlay,
    pointTypes: pointTypes
  };
}]);