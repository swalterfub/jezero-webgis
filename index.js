import 'ol/ol.css';
import {Map, View} from 'ol';
import TileLayer from 'ol/layer/Tile';
import TileWMS from "ol/source/TileWMS";
import { FullScreen, defaults as defaultControls, ScaleLine } from "ol/control";

import LayerSwitcher from 'ol-layerswitcher';

import { register } from "ol/proj/proj4";
import { Projection, getTransform, get } from "ol/proj";
import { getDistance } from "ol/sphere";
import proj4 from "proj4";

import MousePosition from 'ol/control/MousePosition';
import {createStringXY} from 'ol/coordinate';

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
  //extent: [4536590.000, 1013775.000, 4683160.000, 1180560.000],
  //extent: [4363662.941221565, 859975.4272094945, 4808874.452132847, 1296750.544287833],
  getPointResolution: function(resolution, point) {
    var toEPSG49901 = getTransform(get("EPSG:49911"), get("EPSG:49901"));
    var vertices = [ point[0] - resolution / 2, point[1], point[0] + resolution / 2, point[1] ];
    vertices = toEPSG49901(vertices, vertices, 2);
    return getDistance(vertices.slice(0, 2), vertices.slice(2, 4), 3396190);
  }
});

var mainview = new View({
    center: [4602820.147632426, 1090460.3710010552],
    zoom: 9,
    minZoom: 9,
    maxZoom: 19,
    constrainResolution: true,
    extent: [4453619.711390391, 986679.3801616692, 4752020.58387446, 1194241.3618404411],
    projection: projection,
    //maxResolution: 0.3179564670324326
  })

var source = new TileWMS({
        url: "https://maps.planet.fu-berlin.de/jez-bin/wms?",
        params: { LAYERS: "HRSC-hsv" }
      });
source.on('tileloadend', function () {
  console.log(mainview.calculateExtent());
  console.log(mainview.getZoom());

  var reso = mainview.getResolution();
  var scale = 39.37 * 72 * reso;
  //console.log(scale);
  //var scaledenom=(reso *)
  //console.log(mainview.getCenter());
});

var mousePositionControl = new MousePosition({
  coordinateFormat: createStringXY(3),
  projection: 'EPSG:49901'
});

const map = new Map({
  target: 'map',
  layers: [
    new TileLayer({
      title: "HRSC",
      source: source
    }),
    new TileLayer({
      title: "CTX",
      source: new TileWMS({
        url: "https://maps.planet.fu-berlin.de/jez/?",
        params: { LAYERS: "CTX-hsv" }
      })
    }),
    new TileLayer({
      title: "HIRISE",
      source: new TileWMS({
        url: "https://maps.planet.fu-berlin.de/jez/?",
        params: { LAYERS: "HiRISE-hsv" }
      })
    }),
    new TileLayer({
      title: "GRID",
      source: new TileWMS({
        url: "https://maps.planet.fu-berlin.de/jez-bin/wms?",
        params: { LAYERS: "grid" }
      })
    }),
    new TileLayer({
      title: "contour",
      source: new TileWMS({
        url: "https://maps.planet.fu-berlin.de/jez-bin/wms?",
        params: { LAYERS: "contour" }
      })
    }),
    new TileLayer({
      title: "Channels",
      source: new TileWMS({
        url: "https://maps.planet.fu-berlin.de/jez-bin/wms?",
        params: { LAYERS: "channels" }
      })
    })
  ],
  controls: defaultControls().extend([
    new ScaleLine({
      units: "metric",
      //bar: true,
      //text: true,
      minWidth: 125
    }),
    new FullScreen(),
    mousePositionControl
  ]),
  view: mainview
});

//var layerSwitcher = new LayerSwitcher();



var sidebar = new ol.control.Sidebar({
  element: 'sidebar',
  position: 'left'
});
var toc = document.getElementById('layers');
ol.control.LayerSwitcher.renderPanel(map, toc, { reverse: true });
map.addControl(sidebar);