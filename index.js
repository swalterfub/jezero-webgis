import 'ol/ol.css';
import {Map, View} from 'ol';
import TileLayer from 'ol/layer/Tile';
import TileWMS from "ol/source/TileWMS";
import { defaults as defaultControls, ScaleLine } from "ol/control";

import LayerSwitcher from 'ol-layerswitcher';

import { register } from "ol/proj/proj4";
import { Projection, getTransform, get } from "ol/proj";
import { getDistance } from "ol/sphere";
import proj4 from "proj4";

proj4.defs("EPSG:49901", "+proj=longlat +R=3396190 +no_defs ");
proj4.defs(
  "EPSG:49911",
  "+proj=eqc +lat_ts=0 +lat_0=0 +lon_0=0 +x_0=0 +y_0=0 +R=3396190 +units=m +no_defs "
);
register(proj4);
//https://maps.planet.fu-berlin.de/jez-bin/wms?
var projection = new Projection({
  code: "EPSG:49911",
  global: true,
  //extent: [4000000, 0, 4500000, 500000],
  extent: [-10668848.652, -5215881.563, 10668848.652, 5215881.563],
  getPointResolution: function(resolution, point) {
    var toEPSG49901 = getTransform(get("EPSG:49911"), get("EPSG:49901"));
    var vertices = [ point[0] - resolution / 2, point[1], point[0] + resolution / 2, point[1] ];
    vertices = toEPSG49901(vertices, vertices, 2);
    return getDistance(vertices.slice(0, 2), vertices.slice(2, 4), 3396190);
  }
});

const map = new Map({
  target: 'map',
  layers: [
    new TileLayer({
      title: "CTX",
      source: new TileWMS({
        url: "https://maps.planet.fu-berlin.de/jez-bin/wms?",
        params: { LAYERS: "CTX-hsv" }
      })
    }),
    new TileLayer({
      title: "HMC",
      source: new TileWMS({
        url: "https://maps.planet.fu-berlin.de/eqc-bin/wms?",
        params: { LAYERS: "HMChsvlog" }
      })
    }),
  ],
  controls: defaultControls().extend([
    new ScaleLine({
      units: "metric"
    })
  ]),
  view: new View({
    center: [0, 0],
    zoom: 0,
    projection: projection
  })
});

//var layerSwitcher = new LayerSwitcher();

var sidebar = new ol.control.Sidebar({
  element: 'sidebar',
  position: 'left'
});
var toc = document.getElementById('layers');
ol.control.LayerSwitcher.renderPanel(map, toc, { reverse: true });
map.addControl(sidebar);