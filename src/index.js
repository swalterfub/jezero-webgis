import 'ol/ol.css';
import {Map, View, Feature} from 'ol';
import TileLayer from 'ol/layer/Tile';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import {Fill, Stroke, Circle, Style, Text} from 'ol/style';
import {Vector} from 'ol/layer';
import TileWMS from 'ol/source/TileWMS';
import { FullScreen, defaults as defaultControls, ScaleLine, ZoomToExtent } from 'ol/control';
import {bbox as bboxStrategy} from 'ol/loadingstrategy';
import Select from 'ol/interaction/Select';

import 'ol-layerswitcher/dist/ol-layerswitcher.css';
import LayerSwitcher from 'ol-layerswitcher';

import '@fortawesome/fontawesome-free/css/all.css';

import Sidebar from 'sidebar-v2/js/ol3-sidebar.mjs';
import 'sidebar-v2/css/ol3-sidebar.css';

import { register } from 'ol/proj/proj4';
import { Projection, getTransform, get, transform, addProjection, addCoordinateTransforms } from 'ol/proj';
import { getDistance } from 'ol/sphere';
import proj4 from 'proj4';

import MousePosition from 'ol/control/MousePosition';
import {createStringXY} from 'ol/coordinate';

//import * as THREE from 'three';
import * as PANOLENS from 'panolens';

import './jezero.css';

proj4.defs("EPSG:49901", "+proj=longlat +R=3396190 +no_defs");
proj4.defs("EPSG:49911", "+proj=eqc +lat_ts=0 +lat_0=0 +lon_0=0 +x_0=0 +y_0=0 +R=3396190 +units=m +no_defs");
register(proj4);
//https://maps.planet.fu-berlin.de/jez-bin/wms?
var projection49911 = new Projection({
  code: "EPSG:49911",
  global: true,
  units: 'm',
  //extent: [4000000, 0, 4500000, 500000],
  extent: [-10668848.652, -5215881.563, 10668848.652, 5215881.563],
  //extent: [4536590.000, 1013775.000, 4683160.000, 1180560.000],
  //extent: [4363662.941221565, 859975.4272094945, 4808874.452132847, 1296750.544287833],
  getPointResolution: function(resolution, point) {
    var toEPSG49901 = getTransform(get("EPSG:49911"), get("EPSG:49901"));
    var vertices = [ point[0] - resolution / 2, point[1], point[0] + resolution / 2, point[1] ];
    vertices = toEPSG49901(vertices, vertices, 2);
    //console.log(vertices);
    return getDistance(vertices.slice(0, 2), vertices.slice(2, 4), 3396190);
  }
});
addProjection(projection49911);
var projection49901 = new Projection({
    code: 'EPSG:49901',
    extent: [-180, -90, 180, 90],
    units: 'degrees'
});
addProjection(projection49901);

addCoordinateTransforms(
  projection49901,
  projection49911,
  function (coordinate) {
    var xdst=3396190*(coordinate[0]/180*Math.PI);
    var ydst=3396190*(coordinate[1]/180*Math.PI);
    return [ xdst, ydst ];
  },
  function (coordinate) {
    var xdst=(coordinate[0]*180/Math.PI)/3396190;
    var ydst=(coordinate[1]*180/Math.PI)/3396190;
    return [ xdst, ydst ];
  }
);

var zoom = 10;
var center = [4602820.147632426, 1090460.3710010552];
var rotation = 0;

var mainview = new View({
    center: transform([77.4565,18.4475], projection49901, projection49911),
    zoom: zoom,
    minZoom: 10,
    maxZoom: 19,
    constrainResolution: true,
    //extent: [4471445.622758097, 953062.4788152642, 4734194.672506754, 1227858.2631868462],
    extent: [-10668848.652, -5215881.563, 10668848.652, 5215881.563],
    projection: projection49911,
    //maxResolution: 0.3179564670324326
  })

var source = new TileWMS({
        url: "https://maps.planet.fu-berlin.de/jez/?",
        params: { LAYERS: "base-hsv" }
      });
source.on('tileloadend', function () {
  //console.log(mainview.calculateExtent());
  //console.log(mainview.getZoom());
  //coord = transform([35,0], projection49901, projection49911);
  //llcoord = transform(coord, 'EPSG:49911', 'EPSG:49901');
  //console.log(llcoord);
  var reso = mainview.getResolution();
  var scale = 39.37 * 72 * reso;
  //console.log(scale);
  //var scaledenom=(reso *)
  //console.log(mainview.getCenter());
});

var mousePositionControl = new MousePosition({
  coordinateFormat: createStringXY(3),
  projection: projection49901
});

var poiSource = new VectorSource({
  format: new GeoJSON(),
  loader: function (extent, resolution, projection) {
    var proj = projection.getCode();
    var url = 'https://maps.planet.fu-berlin.de/jez-bin/wms?service=WFS&' +
      'version=1.1.0&request=GetFeature&typename=poi&' +
      'outputFormat=application/json&srsname=EPSG:49911&' +
      'bbox=' + extent.join(',') +  proj;
    var xhr = new XMLHttpRequest();
     xhr.open('GET', url);
     var onError = function() {
       vectorSource.removeLoadedExtent(extent);
     }
     xhr.onerror = onError;
     xhr.onload = function() {
       if (xhr.status == 200) {
         //console.dir(xhr.responseText);
         poiSource.addFeatures(
           poiSource.getFormat().readFeatures(xhr.responseText));

         } else {
           onError();
         }
     }
     xhr.send();
   },
  strategy: bboxStrategy,
});

var styleFeature = new Style({
    text: new Text({
      text: '\uf3c5',
      font: '900 24px "Font Awesome 5 Free"',
      textBaseline: 'bottom',
      fill: new Fill({
        color: 'white'
      })
    })
  });

var poi = new Vector({
  title: "POI",
  source: poiSource,
  style: styleFeature
});

const map = new Map({
  target: 'map',
  layers: [
    new TileLayer({
      title: "Topography",
      type: 'base',
      visible: false,
      source: new TileWMS({
        url: "https://maps.planet.fu-berlin.de/jez-bin/wms?",
        params: { LAYERS: "base-dtm" }
      })
    }),
    new TileLayer({
      title: "Colour image map",
      opacity: 1,
      type: 'base',
      visible: true,
      source: source
    }),
    new TileLayer({
      title: "Contour lines",
      source: new TileWMS({
        url: "https://maps.planet.fu-berlin.de/jez/?",
        params: { LAYERS: "contour" }
      })
    }),
    new TileLayer({
      title: "In-/out-flow channels",
      source: new TileWMS({
        url: "https://maps.planet.fu-berlin.de/jez-bin/wms?",
        params: { LAYERS: "channels" }
      })
    }),
    new TileLayer({
      title: "Possible paleo lake-level",
      source: new TileWMS({
        url: "https://maps.planet.fu-berlin.de/jez-bin/wms?",
        params: { LAYERS: "lake" }
      }),
    }),
    poi,
    new TileLayer({
      title: "Lat/Lon GRID",
      source: new TileWMS({
        url: "https://maps.planet.fu-berlin.de/jez-bin/wms?",
        params: { LAYERS: "grid" }
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
    new FullScreen({
      source: 'fullscreen',
    }),
    mousePositionControl,
    new ZoomToExtent({label: 'O', extent: [4471445.622758097, 953062.4788152642, 4734194.672506754, 1227858.2631868462]})
  ]),
  view: mainview
});

//Permalink https://openlayers.org/en/latest/examples/permalink.html
if (window.location.hash !== '') {
  // try to restore center, zoom-level and rotation from the URL
  var hash = window.location.hash.replace('#map=', '');
  var parts = hash.split('/');
  if (parts.length === 4) {
    zoom = parseFloat(parts[0]);
    center = [parseFloat(parts[1]), parseFloat(parts[2])];
    rotation = parseFloat(parts[3]);
  }
}
var shouldUpdate = true;
var view = map.getView();
var updatePermalink = function () {
  if (!shouldUpdate) {
    // do not update the URL when the view was changed in the 'popstate' handler
    shouldUpdate = true;
    return;
  }
  var center = view.getCenter();
  var hash =
    '#map=' +
    view.getZoom().toFixed(2) +
    '/' +
    center[0].toFixed(2) +
    '/' +
    center[1].toFixed(2) +
    '/' +
    view.getRotation();
  var state = {
    zoom: view.getZoom(),
    center: view.getCenter(),
    rotation: view.getRotation(),
  };
  window.history.pushState(state, 'map', hash);
};
map.on('moveend', updatePermalink);
window.addEventListener('popstate', function (event) {
  if (event.state === null) {
    return;
  }
  map.getView().setCenter(event.state.center);
  map.getView().setZoom(event.state.zoom);
  map.getView().setRotation(event.state.rotation);
  shouldUpdate = false;
});

var sidebar = new Sidebar({
  element: 'sidebar',
  position: 'left'
});
var toc = document.getElementById('layers');
LayerSwitcher.renderPanel(map, toc, { reverse: true });
map.addControl(sidebar);

var strokeBig = new Stroke({
       color: 'rgba(51,153,204,1)',
       width: 5
     });

var styleFeatureBig = new Style({
    text: new Text({
      text: '\uf3c5',
      font: '900 28px "Font Awesome 5 Free"',
      textBaseline: 'bottom',
      fill: new Fill({
        color: 'rgba(51,153,204,1)'
      })
    })
  });
var mapdiv = document.getElementById('map');
var tooltip = document.getElementById('tooltip');
var currentFeature = new Feature();
var displayFeatureInfo = function (pixel) {
  //var mapdiv = document.getElementById('map');
  //var tooltip = document.getElementById('tooltip');
  /*info.css({
    //left: pixel[0] + 'px',
    //top: pixel[1] - 15 + 'px',
  });*/
  tooltip.style.left = pixel[0] + 'px';
  tooltip.style.top = (pixel[1] - 50) + 'px';
  var feature = map.forEachFeatureAtPixel(pixel, function (feature) {
    return feature;
  });
  if (feature) {
    //info.attr('data-original-title', feature.get('name')).tooltip('show');
    feature.setStyle();
    feature.setStyle(styleFeatureBig);
    currentFeature=feature;
    var text = feature.get('name');
    tooltip.style.display = 'none';
    tooltip.innerHTML = text;
    tooltip.style.display = 'block';
    mapdiv.style.cursor = "pointer";
  } else {
    //info.tooltip('hide');
    if (currentFeature) {
      currentFeature.setStyle();
      currentFeature.setStyle(styleFeature)
      currentFeature=null;
    };
    tooltip.style.display = 'none';
    mapdiv.style.cursor = "";
  }
};
map.on('pointermove', function (event) {
  if (event.dragging) {
    tooltip.style.display = 'none';
    return;
  }
  displayFeatureInfo(map.getEventPixel(event.originalEvent));
});
var returnToMap = function() {
  //disable map canvas
  var mapdiv = document.getElementById('map');
  mapdiv.style.visibility = 'visible';
  //enable pano canvas
  var panodiv = document.getElementById('pano');
  panodiv.style.visibility = 'hidden';
  view.animate(
      {
        duration: 2000,
        zoom: previousZoom
      });
  //Add layers tab pane
  var maptab = document.getElementById('maptab');
  maptab.className='fas fa-layer-group';
  LayerSwitcher.renderPanel(map, toc, { reverse: true });
  map.removeControl(sidebar);
  map.addControl(sidebar);
  tooltip.style.display = 'block';
  //mapicon.parentElement.onclick=onClickFunction;
}
var previousZoom;
var onClickFunction;
var clickPanoramaFeature = function (pixel) {
  var feature = map.forEachFeatureAtPixel(pixel, function (feature) {
    return feature;
  });
  if (feature) {
    //console.dir(feature.getGeometry().getCoordinates());
    var parts = 1;
    var called = false;
    function switchToPano(complete) {
      //remove tooltip
      tooltip.style.display = 'none';
      var mapdiv = document.getElementById('map');
      mapdiv.style.visibility = 'hidden';
      var panodiv = document.getElementById('pano');
      panodiv.style.visibility = 'visible';
      //remove layers tab pane
      var maptab = document.getElementById('maptab');
      maptab.className='fas fa-map';
      onClickFunction=maptab.parentElement.getAttribute("onclick");
      maptab.parentElement.onclick=function() { returnToMap() };
      viewer.add(pano1);
      //console.dir(mapdiv);
    }
    function callback(complete) {
      --parts;
      if (called) {
        return;
      }
      if (parts === 0 || !complete) {
        called = true;
        switchToPano(complete);
      }
    }
    previousZoom = view.getZoom();
    view.animate(
      {
        center: feature.getGeometry().getCoordinates(),
        duration: 2000,
        zoom: 15
      },
      callback
      );
    
    
  }
}
map.on('singleclick', function (event) {
  clickPanoramaFeature(map.getEventPixel(event.originalEvent));
})
const pano1 = new PANOLENS.ImagePanorama( 'assets/sphere.jpg' );
const viewer = new PANOLENS.Viewer({ output: 'console', container: document.querySelector( '#pano' ) });
//viewer.add(pano1);