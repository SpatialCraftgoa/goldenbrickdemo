var wms_layers = [];


        var lyr_OSMStandard_0 = new ol.layer.Tile({
            'title': 'OSM Standard',
            'opacity': 1.000000,
            
            
            source: new ol.source.XYZ({
            attributions: ' &nbsp &middot; <a href="https://www.openstreetmap.org/copyright">© OpenStreetMap contributors, CC-BY-SA</a>',
                url: 'http://tile.openstreetmap.org/{z}/{x}/{y}.png'
            })
        });
var format_landmarks_1 = new ol.format.GeoJSON();
var features_landmarks_1 = format_landmarks_1.readFeatures(json_landmarks_1, 
            {dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857'});
var jsonSource_landmarks_1 = new ol.source.Vector({
    attributions: ' ',
});
jsonSource_landmarks_1.addFeatures(features_landmarks_1);
var lyr_landmarks_1 = new ol.layer.Vector({
                declutter: false,
                source:jsonSource_landmarks_1,
maxResolution:108.84187810271983,
 
                style: style_landmarks_1,
                popuplayertitle: 'landmarks ',
                interactive: false,
    title: 'landmarks <br />\
    <img src="styles/legend/landmarks_1_0.png" /> 1<br />\
    <img src="styles/legend/landmarks_1_1.png" /> 2<br />\
    <img src="styles/legend/landmarks_1_2.png" /> 3<br />\
    <img src="styles/legend/landmarks_1_3.png" /> 4<br />\
    <img src="styles/legend/landmarks_1_4.png" /> 5<br />' });

lyr_OSMStandard_0.setVisible(true);lyr_landmarks_1.setVisible(true);
var layersList = [lyr_OSMStandard_0,lyr_landmarks_1];
lyr_landmarks_1.set('fieldAliases', {'fid': 'fid', 'name': 'name', });
lyr_landmarks_1.set('fieldImages', {'fid': 'Range', 'name': '', });
lyr_landmarks_1.set('fieldLabels', {'fid': 'no label', 'name': 'no label', });
lyr_landmarks_1.on('precompose', function(evt) {
    evt.context.globalCompositeOperation = 'normal';
});