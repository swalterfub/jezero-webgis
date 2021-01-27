import 'ol/ol.css';
import {Map, View} from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';

import LayerSwitcher from 'ol-layerswitcher';

const map = new Map({
  target: 'map',
  layers: [
    new TileLayer({
      title: "OSM",
      source: new OSM()
    })
  ],
  view: new View({
    center: [0, 0],
    zoom: 0
  })
});

var layerSwitcher = new LayerSwitcher();
map.addControl(layerSwitcher);