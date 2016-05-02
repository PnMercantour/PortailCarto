/*
 *
 *CRÉATION DU CONTENU DE LA MAP
 *
 */

	app.service('map', function(api_postgis){

		var service = this;
		var southWest = L.latLng(43.42144, 5.13159),
			northEast = L.latLng(44.84672, 9.22737),
			bounds = L.latLngBounds(southWest, northEast);
		var map = L.map('map', {
			fullscreenControl: true,
			fullscreenControlOptions: {
				position: 'topleft',
				title: 'Plein écran',
				titleCancel: 'Quitter le mode plein écran'
			}
		}).setView([44.09413,6.99029], 9) ;
		map.options.minZoom = 9;
		map.options.maxBounds = bounds;


		function layerUrl_IGN(key, layer) {
			return "http://wxs.ign.fr/" + key
				+ "/geoportail/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&"
				+ "LAYER=" + layer + "&STYLE=normal&TILEMATRIXSET=PM&"
				+ "TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&FORMAT=image%2Fjpeg";
		}

		scan_express = L.tileLayer(
			layerUrl_IGN(
				"w9wn74qduiunscklhf1354kc", "GEOGRAPHICALGRIDSYSTEMS.MAPS.SCAN-EXPRESS.STANDARD"
			),
			{attribution: '&copy; <a href="http://www.ign.fr/">IGN</a>'}
		);

		ortho = L.tileLayer(
			layerUrl_IGN(
				"w9wn74qduiunscklhf1354kc", "ORTHOIMAGERY.ORTHOPHOTOS"
			),
			{attribution: '&copy; <a href="http://www.ign.fr/">IGN</a>'}
		);

		scan = L.tileLayer(
			layerUrl_IGN(
				"w9wn74qduiunscklhf1354kc", "GEOGRAPHICALGRIDSYSTEMS.MAPS"
			),
			{attribution: '&copy; <a href="http://www.ign.fr/">IGN</a>'}
		);


		var osm = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
					//detectRetina:true,
					//zIndex:1,
					attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
				});

		var outdoors = L.tileLayer('http://{s}.tile.thunderforest.com/outdoors/{z}/{x}/{y}.png', {
					//detectRetina:true,
					attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
				});


		//Chargement du WMS CLC

		var clc_wms = L.tileLayer.wms("http://CLC.developpement-durable.gouv.fr/geoserver/wms", {
			layers: 'clc:CLC12',
			format: 'image/png',
			transparent: true
		});


 		//Chargement du WFS CLC

 		// var clc_wfs = new L.WFST({
			// url: 'http://CLC.developpement-durable.gouv.fr/geoserver/wfs',
			// //typeNS: 'donnees_france', //uri geoserver
			// typeName: 'clc:CLC12', //couche geoserver
			// crs: L.CRS.EPSG4326,
			// geometryField: 'geom', //champ geometrique PostGIS
				// style: {
					// color: 'blue',
					// weight: 2
				// }
		// });

		osm.addTo(map);
		//scan_express.addTo(map);
		//outdoors.addTo(map);
		//geol_wms.addTo(map);
		//clc_wms.addTo(map);



/*
 *CHARGEMENT DES STYLES
 */

		var icone_communes =new L.Icon({
			iconSize: [20, 20],
			iconAnchor: [13, 40],
			popupAnchor: [4, -66],
			iconUrl: '/images/communes.png'
		});

		var style_communes_pnmbdtopo = {
				color:"#000000", // Couleur noir des bordures des communes
				// On ne précise pas de couleurs pour le fond et on le rend transparent avec le fillOpacity
				weight:1,
				fillOpacity: 0
			}


/*
 *
 *CHARGEMENT DES COUCHES
 *
 */

	var layers = {};

	var control_geol_wms = {};
	var control_couche_pnm_coeur_25topo = {};
	var control_couche_pnm_aa_25topo = {};
	var control_couche_pnm_secteurs = {};
	var control_couche_communes_pnmbdtopo = {};
	var control_couche_sites_prio = {};
	var control_couche_hab_vipere = {};


/*
 *WMS Géologie BRGM
 */

		var opacitySlider = new L.Control.opacitySlider();
			//map.addControl(opacitySlider);

		var geol_wms = L.tileLayer.wms("http://geoservices.brgm.fr/geologie", {
			layers: 'GEOLOGIE',
			format: 'image/png',
			transparent: true,
			zIndex:99
		});

		opacitySlider.setOpacityLayer(geol_wms);
		geol_wms.setOpacity(0);
		map.addLayer(geol_wms);
		control_geol_wms = geol_wms;


/*
 *Communes PNM BDTOPO
 */

		api_postgis.getJsonLayer('limregl.communes_pnmbdtopo', ['nom'])
			.then (function(response){
			// on récupère les données JSON et on créé un layer
			var couche_communes_pnmbdtopo = L.geoJson(response.data, {
				style:style_communes_pnmbdtopo,
				// appel de la popup
				onEachFeature: function (feature, layer) {
					//Contenu de la popup
					var nom_com=feature.properties.nom;
					var text_commune='<b>Commune : </b>' + nom_com;

					// Définition de l'OUVERTURE de la popup automatique (mouseover)
					layer.on('mouseover mousemove', function(e){
						var hover_bubble = new L.Rrose({ offset: new L.Point(0,-10), closeButton: false, autoPan: false })
							.setContent(text_commune)
							.setLatLng(e.latlng)
							.openOn(map);
					});
					// Définition de la FERMETURE de la popup automatique
					layer.on('mouseout', function(e){
						map.closePopup()
					});
					// Définition de la SURBRILLANCE de la commune au passage de la souris
					layer.on({
						mouseover:surbrillance,
						mouseout:resetsurbrillance
					});

					//layer.bindPopup(text_commune);
				}

			});
			//map.addLayer(couche_communes_pnmbdtopo);
			control_couche_communes_pnmbdtopo = couche_communes_pnmbdtopo;

					// Fonction de surbrillance
					function surbrillance(e) {
						var objet = e.target;
							objet.setStyle({
								weight: 2,
								color: '#ff0000',
								fillOpacity: 0.1
							});
								if (!L.Browser.ie && !L.Browser.opera) {
									objet.bringToFront();
								}
					}
					// Annulation de la surbrillance
					function resetsurbrillance(e) {
						couche_communes_pnmbdtopo.resetStyle(e.target);
					}


		/*
		 *Outil recherche sur la couche commune
		 */

					var searchControl = new L.Control.Search({layer: couche_communes_pnmbdtopo, propertyName: 'nom', circleLocation:false});
						searchControl.on('search_locationfound', function(e) {
								// si objet trouvé, on change son apparence et on ouvre une infobulle
								e.layer.setStyle({fillColor: '#ff0000', color: '#ff0000', weight: 2 });
								map.setZoom(11);
								//var coordlat=feature.properties.lat_centro;
								//var coordlong=feature.properties.long_centr;
								//map.panTo([coordlat,coordlong]);
									if(e.layer._popup){
										e.layer.openPopup();
									}
								}).on('search_collapsed', function(e) { // on sort de la recherche
									couche_communes_pnmbdtopo.eachLayer(function(layer) {	//restore feature color
									couche_communes_pnmbdtopo.resetStyle(layer);
									});
								});
			map.addControl( searchControl );


/*
 *PNM Coeur 25 topo
 */

		return api_postgis.getJsonLayer('limregl.pnm_coeur_25topo')
		}).then(function(response){
			var couche_pnm_coeur_25topo = L.geoJson(response.data, {
				style: {
					color: "#335412",
					fillColor:"#397814",
					weight: 1,
					fillOpacity: 0.4
				}

			});
			// on ajoute ce layer à la map
			map.addLayer(couche_pnm_coeur_25topo);
			// On le nomme pour s'en servir plus tard dans le controle des couches
			control_couche_pnm_coeur_25topo = couche_pnm_coeur_25topo;


/*
 *PNM aa 25 topo
 */

		return api_postgis.getJsonLayer('limregl.pnm_aa_25topo');
		}).then(function(response){

			var couche_pnm_aa_25topo = L.geoJson(response.data, {
				style: {
					//color:"#ff8860",
					fillColor:"#efb636",
					weight:0,
					fillOpacity:0.4
				}
			});
			// Ajout à la map
			map.addLayer(couche_pnm_aa_25topo);
			control_couche_pnm_aa_25topo = couche_pnm_aa_25topo;


/*
 *PNM secteurs
 */

		return api_postgis.getJsonLayer('limregl.pnm_secteurs_topo', ['nom']);
		}).then(function(response){

			var couche_pnm_secteurs = L.geoJson(response.data, {
				style: {
					"color": "#9d531b",
					"fillOpacity":0,
					"weight": 3
				},
				onEachFeature: function (feature, layer) {
					layer.on({
						mouseover:surbrillance,
						mouseout:resetsurbrillance
					});

					var nom_secteur=feature.properties.nom;
						layer.bindPopup(nom_secteur);
				}
			});
			//map.addLayer(couche_pnm_secteurs);
			control_couche_pnm_secteurs = couche_pnm_secteurs;

				// Fonction de surbrillance
					function surbrillance(e) {
						var objet = e.target;
							objet.setStyle({
								weight: 2,
								color: '#ff0000',
								fillOpacity: 0.1
							});
								if (!L.Browser.ie && !L.Browser.opera) {
									objet.bringToFront();
								}
						info_secteurs.update(objet.feature.properties);
					}
					// Annulation de la surbrillance
					function resetsurbrillance(e) {
						couche_pnm_secteurs.resetStyle(e.target);
						info_secteurs.update();
					}

			var info_secteurs = L.control({position: 'bottomright'});
				info_secteurs.onAdd = function (map){
					this._div = L.DomUtil.create('div', 'info_secteurs');
					this.update();
					return this._div;
				};

				info_secteurs.update = function (props) {
					this._div.innerHTML = '<h4>Secteur</h4>' + (props ? '<b>' + props.nom + '</b>' : 'Survolez un secteur');
				};
				info_secteurs.addTo(map);


/*
 *Grille vipère - impossible a charger, bcp trop lourde... Test via Geoserver ?
 */

		// return api_postgis.getJsonLayer('faune.vipere_orsini_grille_pnm', ['numero_id']);
		// }).then (function(response){

			// var couche_grille_vipere = L.geoJson(response.data, {
				// style: {
					// color:"#000000", // Couleur noir des bordures des communes
									// // On ne précise pas de couleurs pour le fond et on le rend trnasparent avec le fillOpacity
					// weight:1,
					// fillOpacity: 0
				// }
			// });
			// //map.addLayer(couche_grille_vipere);
			// layers["Grille Vipère d'Orsini"] = couche_grille_vipere;


/*
 *Sites prio
 */

		return api_postgis.getJsonLayer('limregl.site_prio', ['nom_site', 'url']);
		}).then (function(response){

			var couche_sites_prio = L.geoJson(response.data, {
				style: {
					fillColor:"#ff0000",
					weight:0,
					fillOpacity: 0.5
				},
				onEachFeature: function (feature, layer) {
					layer.on({
						mouseover:surbrillance,
						mouseout:resetsurbrillance
					});
					// On définit ce qu'on va mettre dans notre popup
					var nom_site_prio=feature.properties.nom_site;
					var url_site_prio=feature.properties.url;
					var text_popup_site_prio='<b>Nom : </b>' + nom_site_prio + '</br> <a href="' + url_site_prio + '" target="_blank">Fiche du site</a>';
					// On appel la popup
					layer.bindPopup(text_popup_site_prio);
				}
			});
			//map.addLayer(couche_sites_prio);
			control_couche_sites_prio = couche_sites_prio;

			// Fonction de surbrillance pour les sites prio
					function surbrillance(e) {
						var objet = e.target;
							objet.setStyle({
								weight: 2,
								color: '#000000',
							});
								if (!L.Browser.ie && !L.Browser.opera) {
									objet.bringToFront();
								}
					}
					// Annulation de la surbrillance
					function resetsurbrillance(e) {
						couche_sites_prio.resetStyle(e.target);
					}


/*
 *Lacs
 */

		return api_postgis.getJsonLayer('limregl.lacs', ['nom_yago', 'id_pdf']);
		}).then (function(response){

			var couche_lacs = L.geoJson(response.data, {
				style: {
					fillColor:"#2668c5",
					weight:0,
					fillOpacity: 0.4
				},
				onEachFeature: function (feature, layer) {
					layer.on({
						mouseover:surbrillance,
						mouseout:resetsurbrillance
					});
					// On définit ce qu'on va mettre dans notre popup
					var nom_lacs=feature.properties.nom_yago;
					var id_pdf_lacs=feature.properties.id_pdf;
					var text_popup_lacs='<b>' + nom_lacs + '</b></br> <a href="http://51.254.17.149/data/pdf_lacs/' + id_pdf_lacs + '.pdf" target="_blank">Fiche du lac</a>';
					// On appel la popup
					layer.bindPopup(text_popup_lacs);
				}
			});
			//map.addLayer(couche_lacs);
			control_couche_lacs = couche_lacs;

			// Fonction de surbrillance pour les lacs
					function surbrillance(e) {
						var objet = e.target;
							objet.setStyle({
								weight: 2,
								color: '#000000',
							});
								if (!L.Browser.ie && !L.Browser.opera) {
									objet.bringToFront();
								}
					}
					// Annulation de la surbrillance
					function resetsurbrillance(e) {
						couche_lacs.resetStyle(e.target);
					}


/*
 *Modélisatiopn habs favorables vipères
 */

		return api_postgis.getJsonLayer('faune.vipere_orsini_hab_fav');
		}).then (function(response){

			var couche_hab_vipere = L.geoJson(response.data, {
				style: {
					fillColor:"#f1e755",
					weight:0,
					fillOpacity: 0.75
				}
			});
			//map.addLayer(couche_hab_vipere);
			control_couche_hab_vipere = couche_hab_vipere;


/*
 *Ongulés comptages des quartiers
 */

		return api_postgis.getJsonLayer('faune.ongules_comptages_quartiers', ['id_quartie', 'nom']);
		}).then (function(response){

			var couche_ongules_comptages_quartiers = L.geoJson(response.data, {
				style: {
					color:"#000000", // Couleur noir des bordures
					// On ne précise pas de couleurs pour le fond et on le rend transparent avec le fillOpacity
					weight:1,
					fillOpacity: 0
				},
				onEachFeature: function (feature, layer) {
					layer.on({
						mouseover:surbrillance,
						mouseout:resetsurbrillance
					});
					// On définit ce qu'on va mettre dans notre popup
					var nom_quartier=feature.properties.nom;
					var id_quartier=feature.properties.id_quartie;
					var text_popup_ongu_comptage_quartier='Numéro : ' + id_quartier + '</br>' + '<b>' + nom_quartier + '</b>';
					// On appel la popup
					layer.bindPopup(text_popup_ongu_comptage_quartier);
				}
			});
			//map.addLayer(couche_hab_vipere);
			control_couche_ongules_comptages_quartiers = couche_ongules_comptages_quartiers;

			// Fonction de surbrillance pour les quartiers
					function surbrillance(e) {
						var objet = e.target;
							objet.setStyle({
								weight: 2,
								color: '#ff0000',
							});
								if (!L.Browser.ie && !L.Browser.opera) {
									objet.bringToFront();
								}
					}
					// Annulation de la surbrillance
					function resetsurbrillance(e) {
						couche_ongules_comptages_quartiers.resetStyle(e.target);
					}



/*
 *
 *CONTROLE DES COUCHES LEAFLET
 *
 */

		}).then(function(){
			//Une fois toutes les couches chargées on affiche le controle des couches qui va servir de légende
			L.control.layers({

				"OpenStreetMap": osm,
				"Scan Express": scan_express,
				"Photos aériennes": ortho,
				"Scan": scan,
				"Outdoors": outdoors,
				"CORINE Land Cover": clc_wms
			},{
				'<div class="rectangle" style="background:rgba(57,120,20,0.4);"></div><div class="content_legende">Coeur de Parc</div>': control_couche_pnm_coeur_25topo,

				'<div class="rectangle" style="background: rgba(239,182,54,0.4);"></div><div class="content_legende">Aire d\'adhésion</div>':control_couche_pnm_aa_25topo,

				'<div class="rectangle_bordure3" style="background-color:#00000;border: 3px solid #9d531b"></div><div class="content_legende">Secteurs</div>':control_couche_pnm_secteurs,

				'<div class="rectangle_bordure2" style="background-color:#00000;border: 2px solid #000000"></div><div class="content_legende">Communes</div>':control_couche_communes_pnmbdtopo,

				'<div class="rectangle" style="background:rgba(255,0,0,0.5)"></div><div class="content_legende">Sites prioritaires</div>':control_couche_sites_prio,

				'<div class="rectangle" style="background:rgba(38,104,197,0.4)"></div><div class="content_legende">Lacs</div>':control_couche_lacs,

				'<div class="rectangle" style="background:rgba(241,231,85,0.75)"></div><div class="content_legende">Habitats favorables Vipère d\'Orsini</div>':control_couche_hab_vipere,

				'<div class="rectangle_bordure2" style="background-color:#00000;border: 2px solid #000000"></div><div class="content_legende">Quartiers de comptages des ongulés</div>':control_couche_ongules_comptages_quartiers,

			},
			{collapsed:false, autoZIndex:true}).addTo(map);

			// Ajout de l'échelle
			L.control.scale({imperial: false}).addTo(map);
			map.addControl(opacitySlider);

		});


	});
