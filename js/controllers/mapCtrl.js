app.controller('DetailMapController', ['$scope', '$routeParams', '$timeout', 'MapsServices', 'baselayersServices',
  'overlaysServices', '$location', 'filterFilter', '$http', '$sce', '$rootScope', '$window',


  function ($scope, $routeParams, $timeout, MapsServices, baselayersServices, overlaysServices, $location,
            filterFilter, $http, $sce, $rootScope, $window) {
    $rootScope.mapinfo = MapsServices.getOne($routeParams.mapsId);
    updateHasPOINavigation();
    $scope.maps = MapsServices.maps;
    if (!MapsServices.maps.length) {
      var dfd = MapsServices.loadData();
      dfd.then(function () {
        $scope.mapinfo = MapsServices.getOne($routeParams.mapsId);
        $scope.maps = MapsServices.maps;
        updateHasPOINavigation();
      });
    }

    /* Update value that is checked to display next / previous buttons in info overlay */
    function updateHasPOINavigation() {
      if (!$scope.mapinfo) {
        $scope.hasPOINavigation = false;
      } else {
        var mapId = $scope.mapinfo.id;
        $scope.hasPOINavigation =
          mapId === 'LacsRemarquables'
          || mapId === 'Sommetsemblematiques'
          || mapId === 'SitesIncontournables'
          || mapId === 'Vallees'
          || mapId === 'point_info';
      }
    }

    $scope.$watch('mapinfo', function () {
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
          text: 'Rechercher',
          placeholder: 'Rechercher un lieu...'
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
        var counter = 0;
        angular.forEach(overlays, function (value, key) {
          if (!value.group) {
            $scope.showOtherGroup = true;
          }
          overlaysServices.getOverlay(value)
            .then(function (overlay) {
              $scope.overlays[key] = overlay;
              if (value.active && $scope.map) {
                $scope.overlays[key].feature.addTo($scope.map);
              }
              counter += 1;
              if (counter === overlays.length) {
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
        var legend = L.control({position: 'bottomright'});
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

    /* Change selected point of interest
     * method can be 'next' or 'previous';
     */
    $scope.changePOI = function (method) {
      if (!(method === 'previous' || method === 'next')) {
        throw Error('changePOI takes argument: "next" or "previous"')
      }

      // get index of last feature for circular navigation
      var maxFeatureIndex = 0;
      $scope.map.eachLayer(function (layer) {
        layer.fire('mouseout');  // Hide popup on previous POI
        if (layer.featureIndex) {
          if (layer.featureIndex > maxFeatureIndex) {
            maxFeatureIndex = layer.featureIndex;
          }
        }
      });

      var layers = {};
      var featureIndex = $scope.featureIndex;
      var looped = false;
      while (layers.marker === undefined) {
        // try to get next or previous available marker
        if (method === 'previous') {
          featureIndex -= 1;

          // check if we have to loop now
          if (featureIndex < 0) {
            if (looped) {
              break;
            } else {
              featureIndex = maxFeatureIndex;
              looped = true;
            }
          }
        } else if (method === 'next') {
          featureIndex += 1;

          // check if we have to loop now
          if (featureIndex > maxFeatureIndex) {
            if (looped) {
              break;
            } else {
              featureIndex = 0;
              looped = true;
            }
          }
        }

        layers = getLayersByFeatureIndex(featureIndex);
      }

      if (layers.marker) {
        moveToLayers(layers);
      }
    };

    /*
     * get cluster and marker of feature by index
     */
    function getLayersByFeatureIndex(featureIndex) {
      var featureMarker;
      var featureMarkerCluster;
      var layerNum = 0;
      $scope.map.eachLayer(function (layer) {
        layerNum += 1;
        if (isMarkerOfFeature(layer, featureIndex)) {
          featureMarker = layer;
        } else if (isCluster(layer)) {
          layer.getAllChildMarkers().map(function (marker) {
            if (isMarkerOfFeature(marker, featureIndex)) {
              featureMarkerCluster = layer;
              featureMarker = marker;
            }
          })
        }
      });
      return {'marker': featureMarker, 'cluster': featureMarkerCluster}
    }

    function moveToLayers(layers) {
      if (layers.cluster) {
        layers.cluster.zoomToBounds();
        if (layers.marker) {
          $timeout(function () {
            updateOverlay(layers.marker)
          }, 1000, false)
        }
      } else if (layers.marker) {
        var latng;
        if (layers.marker.getLatLng) {  // marker
          latng = layers.marker.getLatLng();
          var zoom = ($scope.map.getZoom() < 12) ? 12 : $scope.map.getZoom();
          var offset;  // latitude offset to prevent point from being under overlay
          if (zoom <= 13) {
            offset = 0.02;
          } else if (zoom <= 15) {
            offset = 0.01;
          } else {
            offset = 0.00
          }
          $scope.map.setView([latng.lat - offset, latng.lng], zoom);
        } else if (layers.marker.getBounds) {  // polygon
          $scope.map.setView(layers.marker.getBounds().getCenter());
        }
        updateOverlay(layers.marker);
      }
    }

    function isCluster(layer) {
      return layer._markers !== undefined;
    }

    /*
     * return true if the layer is the marker of the feature by featureIndex
     */
    function isMarkerOfFeature(layer, featureIndex) {
      return (layer.featureIndex && layer.featureIndex === featureIndex);
    }

    function updateOverlay(marker) {
      $timeout(function () {
        marker.fire('click');
      }, 0, false);
    }

    function selectLayer(ev, contextParams) {
      ev.preventDefault();
      var selectedElement = contextParams.context;

      var originalEvent = contextParams.originalEvent;
      var selectedLayer = selectedElement.layer;

      var changed = false;
      if (selectedLayer.featureIndex
        && selectedLayer.featureIndex === selectedElement.feature.properties.index
        && !selectedLayer.feature) {
        selectedLayer.feature = selectedElement.feature;
      }

      var selectedFeature = selectedElement.feature;
      $scope.featureIndex = selectedFeature.properties.index;
      if (selectedFeature) {
        var markerLayer = originalEvent.layer || selectedLayer;
        $scope.selected = updateSelectedLayer($scope.selected, selectedLayer, markerLayer);
        changed = true;

        if (selectedElement.infoBand) {
          $scope.infoBand = selectedElement.feature.properties;
          $scope.infoBandDescript = $sce.trustAsHtml(selectedFeature.properties.descript);
          $scope.openInfoBand();
        } else {
          $scope.infoBand = null;
          $scope.closeInfoBand();
        }
      }

      if (changed) {
        $scope.$apply();
      }
    }

    function updateSelectedLayer(previouslySelected, newLayer, markerLayer) {
      var previousStyle = {};
      var previousGeometryType;

      if (previouslySelected) {
        previousGeometryType = previouslySelected.layer.feature.geometry.type;

        if (overlaysServices.pointTypes.indexOf(previousGeometryType) < 0) {
          previouslySelected.layer.setStyle(previouslySelected.previousStyle);
        } else {
          previouslySelected.markerLayer.setOpacity(overlaysServices.defaultOpacity);
        }
      }


      if (overlaysServices.pointTypes.indexOf(newLayer.feature.geometry.type) < 0) {
        previousStyle = newLayer.options.style();
        newLayer.setStyle({color: 'yellow'});
      } else {
        markerLayer.setOpacity(1);
      }

      return {layer: newLayer, previousStyle: previousStyle, markerLayer: markerLayer};
    }

    $scope.showInfoBand = false;
    $scope.selected = null;
    $scope.infoBand = null;
    $scope.infoBandDescript = null;
    var unregisterFeatureClick = $scope.$on('feature:click', selectLayer);
    $scope.$on('$destroy', function () {
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
    });
  }
]);
