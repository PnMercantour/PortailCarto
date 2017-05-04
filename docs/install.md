## Installation du PortailCarto
###### Dernière maj doc 26/07/2016


![Logo PNM](https://github.com/PnMercantour/PortailCarto/blob/master/img/logos/logo_pnm_vert.png?raw=true)

-----


### 0 - Pré-requis
* Installation fraiche d'un Debian Jessie
* Connexion en SSH à un utilisateur hors root


### 1 - Installation de sudo
Afin de faciliter certaines opérations, installation du paquet sudo
```
	su root
	apt-get update
	apt-get install sudo
```
Puis ajout de notre utilisateur au groupe sudo :
```
	adduser <MON_USER> sudo
```
Fermer la fenêtre SSH ou se déconnecter complètement et ensuite se reconnecter avec son user pour que les changements soient appliqués

Faire les MAJ de la distribution :
```
	sudo apt-get update
	sudo apt-get upgrade
	sudo apt-get dist-upgrade
```


### 2 - Installation d'Apache, php5 et php5-pgsql

```
	sudo apt-get install apache2 php5 php5-pgsql libapache2-mod-php git
	sudo /etc/init.d/apache2 restart
```

On ubuntu 16.04:

    
    sudo service nginx stop  # if nginx is installed
    sudo add-apt-repository ppa:ondrej/php
    sudo apt update
    sudo apt install libapache2-mod-php5.6 php5.6-pgsql
    sudo a2enmod php5.6
    sudo  service apache2 restart
    

### 3 - Installation

Si pas de tag existant et que l'on veut travailler sur une branche particulière du dépôt GitHub :
```
cd /home/MON_USER
git clone https://github.com/PnMercantour/PortailCarto.git
cd PortailCarto
```
A ce stade nous sommes positionné sur la branche master du dépôt.
Pour basculer sur une autre branche :
```
git checkout <MA_BRANCHE>
```

#### Génération de l'application

Il vous faut générer les assets optimisés, pour cela, depuis le dossier /home/MON_USER/PortailCarto:
    
    npm install
    npm run build

### 4 - Config lien symbolique dans le rep Apache

```
sudo ln -s /home/MON_USER/PortailCarto/ /var/www/html/portail
```

On vérifie le fonctionnement dans le navigateur à l'adresse : http://localhost/portail

L'adresse en mode développement est:

    http://localhost/portail/index-src.html


### 5 - Config de l'appli : la connexion à la BDD

Deux fichiers sont à remplacer :

Le premier est le fichier de connexion PHP à la base de données postgreSQL.
Il est placé à la racine du répertoire et se nomme ``postgis_geojson.php``.
Nous allons le créer à partir du fichier sample :
```
	cd /home/MON_USER/PortailCarto/
	cp postgis_geojson.php.sample postgis_geojson.php
	nano postgis_geojson.php
```

A la ligne 64, remplacez les champs ``YOUR_DB_NAME``, ``USERNAME``, ``PASSWORD``, ``IP OR URL SERVEUR`` par vos identifiants de connexion à votre base postgreSQL
Controlez éventuellement le port...


### 6 - Config de l'appli : le fichier de configuration des cartes

L'ensemble des cartes, et des couches présentes dans ces cartes, se configure au niveau d'un seul fichier se situant dans le dossier data et s'appelant maps.json. Un exemple est disponible : [maps.json.sample](/data/maps.json.sample)

Ce fichier JSON va permettre de controller les couches à afficher/masquer, leur style, etc...


#### 6.1 - La config générale d'une carte

``` json
	"order" : 1,
	"id": "limregl",
	"geosearch": true,
	"imageUrl": "http://catalogue.parcnational.fr/overview/pnf/communes_PNM_aout2015.TAB_overview.png",
	"name": "Limites et réglementations",
	"snippet": "Cartes des limites réglementaires du Parc national du Mercantour",
	"center": {
		"lat": 44.09413,
		"lng": 6.99029,
		"zoom": 9
	},
	"bounds": {
		"southWest": {
			"lat":43.42144,
			"long":5.13159
		},
		"northEast": {
			"lat":44.84672,
			"long":9.22737
		},
		"minZoom": 9,
		"maxZoom": 18
	},
```

Dans cette partie va être définie l'ordre d'apparition de la carte sur la page d'accueil, son identifiant (qui doit être unique), l'image d'aperçu et son nom qui apparaitront également sur la page d'acceuil.
Ensuite on définit le centrage de la carte à son ouverture, ainsi que son niveau de zoom.
Enfin la partie ``bounds`` sert à bloquer l'emprise de la carte, ainsi que le zoom max et min possible par l'utilisateur.


#### 6.2 - La config des fonds de cartes (baselayers)

De la même manière et à la suite :

``` json
	"baselayers": [
		{
			"id": "3",
			"name": "IGN - Cadastres",
			"type": "ign",
			"layer":"CADASTRALPARCELS.PARCELS",
			"key":"MA clé IGN API",
			"format":"image/png",
			"style":"bdparcellaire_o",
			"active": false,
			"options":{}
		},{
			"id": "2",
			"name": "IGN - Ortho",
			"type": "ign",
			"layer":"ORTHOIMAGERY.ORTHOPHOTOS",
			"key":"MA clé IGN API",
			"format":"image/jpeg",
			"style":"normal",
			"active": false,
			"options":{}
		},{
			"id": "1",
			"name": "OpenStreetMap",
			"type": "xyz",
			"url": "http://{s}.tile.osm.org/{z}/{x}/{y}.png",
			"active": true,
			"options":{}
		}
	],
```


#### 6.3 - La config des couches (overlays)

``` json
	"overlays": {
		"groups": [
			{ "id": "groupId1", "label": "Group 1 label" },
			{ "id": "groupId2", "label": "Group 2 label" },
			{ "id": "tourism", "label": "Tourisme" }
		],
		"values": [
			{
				"id":"coeur",
				"name": "Coeur de Parc",
				"type": "geojson",
				"active": true,
				"thumbnail": "http://rando.mercantour.eu/custom/images/logo_pnam_pnm.jpg",
				"champ_geom": "geom",
				"table": "limregl.cr_pnm_coeur_cad",
				"fields": "id",
				"group": "groupId1",
				"options": {
					"style": "function (feature) { return { color:'#0033ff',  fill:'#0033ff', opacity: 0.4, fillOpacity: 0.2}; }",
					"onEachFeature": "function (feature, layer) { layer.bindPopup(\"Texte d'exemple dans la popup\"); }"
				}
			},
			{
				"id":"aa",
				"name": "Aire d'adhésion",
				"type": "geojson",
				"active": true,
				"champ_geom": "geom",
				"table": "limregl.cr_pnm_aa_topo",
				"fields": "surface, name",
				"group": "groupId2",
				"options": {
					"style": "function (feature) { return { color:'#0033ff',  fill:'#0033ff', opacity: 0.4, fillOpacity: 0.2}; }",
					"onEachFeature": "function (feature, layer) {layer.bindTooltip(\"<h2>\"+feature.properties.name+\"</h2>\"); }"
				}
			},
			{
				"id":"aoa",
				"name": "Aire optimale d'adhésion",
				"type": "geojson",
				"active": true,
				"champ_geom": "geom",
				"table": "limregl.cr_pnm_aoa_topo",
				"fields": "id",
				"group": null,
				"options": {
					"style": "function (feature) { return { color:'#0033ff',  fill:'#0033ff', opacity: 0.4, fillOpacity: 0.2}; }",
				}
			},
			{
				"id":"must-see",
				"name": "Incontournables",
				"type": "geojson",
				"active": true,
				"infoBand": true,
				"champ_geom": "geom",
				"table": "tourisme.sites_incontournables",
				"fields": "id, title, descript, file, other, pic_1, titlepic_1, ownerpic_1, pic_2, titlepic_2, ownerpic_2, video",
				"group": "tourism",
				"options": {
					"onEachFeature": "function (feature, layer) {layer.bindTooltip('<h2>' + feature.properties.title + '</h2>');}"
				}
			}
		]
	}
```

* Pour le moment seul le type geojson est supporté.
* La récupération d'au moins 1 champ (fields) est recommandée. Sinon, tous les champs de la table sont récupérés...
* Les options n'ont pas encore été améliorées, récupération du travail d'Amandine Sahl du Parc des Cévennes : https://github.com/PnCevennes/ng-mapCreator-fp


#### 6.4 - Récapitulatif du maps.json

Architecture du ``maps.json`` : se référer au fichier [maps.json.sample](data/maps.json.sample)
