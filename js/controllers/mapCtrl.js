app.controller('DetailMapController', ['$scope', '$routeParams', 'MapsServices', 'baselayersServices',
  'overlaysServices', '$location', 'filterFilter', '$http', '$sce', '$rootScope', '$window',

  function ($scope, $routeParams, MapsServices, baselayersServices, overlaysServices, $location,
    filterFilter, $http, $sce, $rootScope, $window) {
    $rootScope.mapinfo = MapsServices.getOne($routeParams.mapsId);

    if (!MapsServices.maps.length) {
      var dfd = MapsServices.loadData();
      dfd.then(function () {
        $scope.mapinfo = MapsServices.getOne($routeParams.mapsId);
      });
    }

    $scope.$watch('mapinfo', function (scope) {
      if (!$scope.mapinfo) {
        return;
      }

      if ($scope.map) {
        $scope.map.remove();
        $scope.map = null;
      }
      $scope.map = L.map('mapx', {
        zoomControl: false
      });

      //Center
      if ($scope.mapinfo.center) {
        $scope.map.setView([$scope.mapinfo.center.lat, $scope.mapinfo.center.lng], $scope.mapinfo.center.zoom);
      }

      // Bounds control and min/max zoom control
      // Configuré dans le maps.json
      var southWest = L.latLng($scope.mapinfo.bounds.southWest.lat, $scope.mapinfo.bounds.southWest.long);
      var northEast = L.latLng($scope.mapinfo.bounds.northEast.lat, $scope.mapinfo.bounds.northEast.long);
      bounds = L.latLngBounds(southWest, northEast);
      $scope.map.options.maxBounds = bounds;
      $scope.map.options.minZoom = $scope.mapinfo.bounds.minZoom;
      $scope.map.options.maxZoom = $scope.mapinfo.bounds.maxZoom;

      //Geosearch
      if (($scope.mapinfo.geosearch) && ($window.innerWidth > 800)) {
        var osmGeocoder = new L.Control.OSMGeocoder({
          collapsed: false,
          position: 'topright',
          text: 'Rechercher'
        });
        osmGeocoder.addTo($scope.map);
      }

      // Zoom Control
      L.control.zoom({
        position: 'topright'
      }).addTo($scope.map);

      //baselayers
      $scope.baselayers = [];
      angular.forEach($scope.mapinfo.layers.baselayers, function (value, key) {
        $scope.baselayers[key] = baselayersServices.loadData(value);
        if (value.active) {
          $scope.baselayers[key].map.addTo($scope.map);
        }
      });

      //overlays
      var overlaysObject = $scope.mapinfo.layers.overlays;
      var overlays = overlaysObject ? overlaysObject.values : null;
      var overlaysGroups = overlaysObject ? overlaysObject.groups : null;
      $scope.overlaysGroups = [];
      if (overlaysGroups) {
        $scope.overlaysGroups = overlaysGroups;
      }
      $scope.showOtherGroup = false;
      $scope.overlays = [];
      if (overlays && overlays.length > 0) {
        $scope.overlaysLoading = true;
        angular.forEach(overlays, function (value, key) {
          if (!value.group) {
            $scope.showOtherGroup = true;
          }
          overlaysServices.getOverlay(value)
            .then(function (overlay) {
              $scope.overlays[key] = overlay;
              if (value.active) {
                $scope.overlays[key].feature.addTo($scope.map);
              }
              if (overlays.length === $scope.overlays.length) {
                $scope.overlaysLoading = false;
              }
            });
        });
      }

      // Sidebar
      var sidebar = L.control.sidebar('sidebar').addTo($scope.map);

      // Control emprise initiale EasyButton
      L.easyButton({
        position: "topright",
        states: [{
          icon: 'glyphicon glyphicon-home',
          title: 'Emprise initiale',
          onClick: function () {
            $scope.map.setView([$scope.mapinfo.center.lat, $scope.mapinfo.center.lng], $scope.mapinfo.center.zoom);
          }
        }]
      }).addTo($scope.map);

      // Control échelle
      L.control.scale({
        imperial: false,
        position: 'bottomright',
        updateWhenIdle: false
      }).addTo($scope.map);

      // Control FullScreen
      L.control.fullscreen({
        pseudoFullscreen: true // if true, fullscreen to page width and height
      }).addTo($scope.map);



      //Legend
      if ($scope.mapinfo.legend) {
        var legend = L.control({ position: 'bottomright' });
        legend.onAdd = function () {
          var div = L.DomUtil.create('div', 'info legend  visible-lg');
          div.innerHTML = $sce.trustAsHtml($scope.mapinfo.legend);
          return div;
        };
        legend.addTo($scope.map);
      }
      return $scope;
    }, true);

    $scope.toggleOverlay = function (overlay) {
      if (!overlay.active && $scope.map.hasLayer(overlay.feature)) {
        $scope.map.removeLayer(overlay.feature);
      }
      if (overlay.active && !$scope.map.hasLayer(overlay.feature)) {
        $scope.map.addLayer(overlay.feature);
      }
    };

    $scope.changeTiles = function (nummap) {
      if ($scope.baselayers[nummap].active) {
        $scope.map.removeLayer($scope.baselayers[nummap].map);
        $scope.baselayers[nummap].active = false;
      } else {
        $scope.baselayers[nummap].map.addTo($scope.map);
        $scope.baselayers[nummap].active = true;
      }
      angular.forEach($scope.baselayers, function (value, key) {
        if (key !== nummap) {
          $scope.map.removeLayer($scope.baselayers[key].map);
          $scope.baselayers[key].active = false;
        }
      });
    };

    function updateSelectedLayer(previouslySelected, newLayer, originalEvent) {
      var previousStyle = {};
      var previousGeometryType;

      if (previouslySelected) {
        previousGeometryType = previouslySelected.layer.feature.geometry.type;

        if (overlaysServices.pointTypes.indexOf(previousGeometryType) < 0) {
          previouslySelected.layer.setStyle(previouslySelected.previousStyle);
        } else {
          previouslySelected.markerLayer.setOpacity(0.6);
        }
      }

      if (overlaysServices.pointTypes.indexOf(newLayer.feature.geometry.type) < 0) {
        previousStyle = newLayer.options.style();
        newLayer.setStyle({ color: 'yellow' });
      } else {
        originalEvent.layer.setOpacity(1);
      }

      return { layer: newLayer, previousStyle: previousStyle, markerLayer: originalEvent.layer };
    }

    $scope.closeInfoBand = function closeInfoBand() {
      $scope.showInfoBand = false;
    };

    $scope.openInfoBand = function openInfoBand() {
      $scope.showInfoBand = true;
    };

    $scope.previousSlide = function previousSlide() {
      var slider = $('#infoBand-carousel');
      if (slider) {
        slider.carousel('prev');
      }
    };

    $scope.nextSlide = function nextSlide() {
      var slider = $('#infoBand-carousel');
      if (slider) {
        slider.carousel('next');
      }
    };

    function selectLayer(ev, contextParams) {
      var element = contextParams.context;
      if (element.feature) {
          var originalEvent = contextParams.originalEvent;

          $scope.selected = updateSelectedLayer($scope.selected, element.layer, originalEvent);
          if (element.infoBand) {
            $scope.infoBand = element.feature.properties;
            $scope.infoBandDescript = $sce.trustAsHtml(element.feature.properties.descript);
            $scope.openInfoBand();
          } else {
            $scope.infoBand = null;
            $scope.closeInfoBand();
          }

          $scope.$apply();
      }

    }

    $scope.showInfoBand = false;
    $scope.selected = null;
    $scope.infoBand = null;
    $scope.infoBandDescript = null;
    var unregisterFeatureClick = $scope.$on('feature:click', selectLayer);
    $scope.$on('$destroy', function iVeBeenDismissed() {
      if ($scope.map) {
        unregisterFeatureClick();
        $scope.infoBand = null;
        $scope.infoBandDescript = null;
        $scope.map.remove();
        $scope.map = null;
        $scope.selected = null;
        $rootScope.mapinfo = null;
        $scope.mapinfo = null;
      }
    })

  }

]);
