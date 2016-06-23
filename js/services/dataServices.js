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
      }
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
            url = 'https://gpp3-wxs.ign.fr/' + layerdata.key + '/geoportail/wmts?LAYER='+layerdata.layer+'&EXCEPTIONS=text/xml&FORMAT=image/jpeg&SERVICE=WMTS&VERSION=1.0.0&REQUEST=GetTile&STYLE=normal&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}';
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
