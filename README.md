# palpp-heatmap-demo

## Capture d'écran

![alt tag](https://user-images.githubusercontent.com/14871637/28744603-a5a3b6a2-7464-11e7-82ac-b32bbb92abe2.png)

## Présentation
Le projet PALPP étudie l'eyetracking ou oculométrie.
"L'oculométrie est un outil d'analyse qui permet de déterminer à quel endroit se pose le regard d'une personne. Cette information peut servir pour étudier le comportement humain ou commander un système. Par exemple, l'eyetracking trouve de nombreuse applications dans l'assistance aux personnes à mobilité réduite.
Il existe deux catégories de système : avec ou sans contact." (source : http://www.label.mips.uha.fr/vision3d.php).

Cette démonstration du lecteur JavaScript est destinée à jouer des sessions d'oculométrie dont les données proviennent de fichiers "csv" ou "json".
Les données récoltées pour la démonstration proviennent de systèmes avec contact :
* un système Pupil  fabriqué par Pupil Labs
* un système SMI Eye Tracking Glasses (données capturées pendant une partie de basket).


## Exécution
 
 * Dans un navigateur, ouvrir le fichier "app/demo.html".
 * Une barre d'outil sommaire permet de visualiser :
	 * le déplacement progressif en temps réel de la pupille de l’œil (**ProgressivePath**).
	 * la représentation complète en fil de fer des déplacements (**FullPath**).
	 * la carte de chaleur mettant en valeur les points chauds du regard (**HeatMap**).

## Explications

Structure du projet

* app/input

Contient les fichiers de données nécessaires à la lecture d'une session : horodatage, positions des pupilles, ...

  * app/scripts/player.js

Contient toutes les fonctionnalités du lecteur, notamment les appels aux bibliothèques JavaScript Raphaël et Heatmap qui effectuent les tracés vectoriels et la carte de chaleur.
Pour modifier le fichier que l'on souhaite lire, il est nécessaire de changer les paramètres de la méthode suivante :

parseData("http://localhost:63342/PALPP-HeatmapDemo/app/input/data.json", "pupil", "json", "heatmap", doStuff)

Paramètres :
param 1 : url du fichier à traiter (accepte les fichiers JSON et CSV avec Header en 1ère ligne et les données sur les autres lignes)
param 2 : type du device de capture (accepte pupil et smi)
param 3 : extension du fichier à traiter (accepte JSON et CSV, voir param 1)
param 4 : id de l'élement html dans lequel s'insère la carte de chaleur et les chemins (ne pas modifier si le script est exécuté dans demo.html)
param 5 : fonction appelée en rappel après le parse (ne pas modifier)
