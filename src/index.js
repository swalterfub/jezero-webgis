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
//import * as PANOLENS from 'panolens';
import 'aframe';

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
//var mapCenter = transform([77.4565,18.4475], projection49901, projection49911);
var mapCenter = transform([77.6790,18.4022], projection49901, projection49911);
var rotation = 0;


//const viewer = new PANOLENS.Viewer({ output: 'console', container: document.querySelector( '#pano' ) });

var mainview = new View({
    center: mapCenter,
    zoom: zoom,
    minZoom: 9,
    maxZoom: 19,
    constrainResolution: true,
    extent: [4504877, 1007670, 4741975, 1185493],
    //extent: [-10668848.652, -5215881.563, 10668848.652, 5215881.563],
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
/*var poiSource = new VectorSource({
  //format: new GeoJSON(),
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
           poiSource.forEachFeature(addPano);
           var text = poiSource.getFormat().writeFeatures(poiSource.getFeatures());
           console.dir(text);
         } else {
           onError();
         }
     }
     xhr.send();
   },
  strategy: bboxStrategy,
});*/
class Panorama {
  constructor(feature) {
    this.id=feature.get('id');
    this.name=feature.get('name');
    this.image=feature.get('panorama');
    //console.dir(this.image);
    if (feature.get('rotation') === undefined) {
      feature.set('rotation','0 0 0');
    }
    this.rotation=feature.get('rotation');
    if (feature.get('icon') === undefined) {
      feature.set('icon','map-marker-alt');
    }
    this.icon=feature.get('icon');
    this.infos=[];
  }
}
var addPano=function(feature){
  var id = feature.get('id');
  feature.setId(id);
  panos[id] = new Panorama(feature);
}
var currentPano=-1;
var panos = [];
var ll2xyz = function(coordinates){
  var xyz = transform(coordinates, projection49901, projection49911);
  return xyz;
}
var featuresAsText='{"type":"FeatureCollection","features":[\
  {"type":"Feature","geometry":{"type":"Point","coordinates":['+ll2xyz([77.4565,18.4475]).toString()+']},"properties":{"id":"6","name":"Perseverance landing site","icon":"parachute-box","link":"","content":"","zoom":"14","panorama":"Camera14_landing_site_spheric","rotation":"0 60 0"}},\
  {"type":"Feature","geometry":{"type":"Point","coordinates":[4632176.210556282,1074653.2601958876]},"properties":{"id":"5","name":"Mountain view","link":"","content":"","zoom":"12","panorama":"sphere2","rotation":"-20 80 0"}},\
  {"type":"Feature","geometry":{"type":"Point","coordinates":['+ll2xyz([77.46,18.530]).toString()+']},"properties":{"id":"1","name":"Delta basement","link":"","content":"","zoom":"14","panorama":"Camera5_inflow_spheric2","rotation":"0 120 0"}},\
  {"type":"Feature","geometry":{"type":"Point","coordinates":['+ll2xyz([77.4,18.5]).toString()+']},"properties":{"id":"2","name":"Delta top","link":"","content":"","zoom":"14","panorama":"Camera5_delta_spheric2","rotation":"-30 240 0"}},\
  {"type":"Feature","geometry":{"type":"Point","coordinates":[4629228.058937868,1098332.5630884669]},"properties":{"id":"0","name":"Outflow channel","link":"","content":"","zoom":"12","panorama":"Camera8_outflow_2_spheric","rotation":"-20 -80 0"}},\
  {"type":"Feature","geometry":{"type":"Point","coordinates":[4580081.744192608,1096482.1274981857]},"properties":{"id":"3","name":"Inlet 1","link":"","content":"","zoom":"12","panorama":"Camera4_inflow_spheric3","rotation":"-20 90 0"}},\
  {"type":"Feature","geometry":{"type":"Point","coordinates":['+ll2xyz([77.688, 18.396]).toString()+']},"properties":{"id":"4","name":"Jezero crater center","link":"","content":"","zoom":"9","panorama":"Camera15_center_crater","rotation":"-30 100 0"}}]}';
  //{"type":"Feature","geometry":{"type":"Point","coordinates":[4595104.772120481,1113418.3176465204]},"properties":{"id":"7","name":"Inlet 2","link":"","content":"","zoom":"14","panorama":"sphere"}},\
  
var poiSource = new VectorSource({
  features: new GeoJSON().readFeatures(featuresAsText)
});
poiSource.forEachFeature(addPano);
var styleFeature = new Style({
    text: new Text({
      text: '\uf041',
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
var whiteFill=new Fill({
        color: 'rgba(255,255,255,1)'
      });
var cyanFill=new Fill({
        color: 'rgba(51,153,204,1)'
      });
var styleFeatureBig = new Style({
    text: new Text({
      text: '\uf041',
      font: '900 24px "Font Awesome 5 Free"',
      textBaseline: 'bottom',
      fill: new Fill({
        color: 'rgba(51,153,204,1)'
      })
    })
  });
var mapdiv = document.getElementById('map');
//var currentFeature = new Feature();
var displayFeatureInfo = function (pixel) {
  tooltip.style.left = pixel[0] + 'px';
  tooltip.style.top = (pixel[1] - 50) + 'px';
  var feature = map.forEachFeatureAtPixel(pixel, function (feature) {
    return feature;
  });
  if (feature) {
    feature.setStyle();
    feature.setStyle(styleFeatureBig);
    currentFeature=feature;
    var text = feature.get('name');
    tooltip.style.display = 'none';
    tooltip.innerHTML = text;
    tooltip.style.display = 'block';
    mapdiv.style.cursor = "pointer";
  } else {
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
var currentFeature;
var returnToMap = function() {
  //disable map canvas
  var mapdiv = document.getElementById('map');
  mapdiv.classList.remove('hidden');
  //enable pano canvas
  var panodiv = document.getElementById('pano');
  panodiv.classList.add('hidden');
  //show layers tab pane
  var ltab = document.getElementById('ltab');
  ltab.classList.remove('hidden');
  //remove map tab pane
  var mtab = document.getElementById('mtab');
  mtab.classList.add('hidden');
  var vrtab = document.getElementById('vrtab');
  vrtab.classList.add('disabled');
  var vrtab = document.getElementById('vrtab');
  vrtab.classList.add('disabled');
  var sound=document.getElementById('insightsnd');
  sound.pause();
  for (const pano of panos){
    let loopli=document.getElementById('pli-'+pano.id);
    loopli.classList.remove('selected');
  }
  mainview.animate({
    duration: 2000,
    zoom: previousZoom
  });
  //console.dir('dispose Pano');
  var asky=document.getElementById('panorama');
  asky.removeAttribute('src');
  tooltip.innerHTML='';
  tooltip.style.display = 'block';
}
var previousZoom;
var onClickFunction;
//Define map tab onclick action
var mapbutton = document.getElementById('mapbutton');
mapbutton.parentElement.onclick=function() {
  returnToMap();
  //updatePermalink();
  };
var vrbutton = document.getElementById('vrbutton');
vrbutton.parentElement.onclick=function() {
  console.dir('nothing');
  //updatePermalink();
  };
function switchToPano(id) {
  //geht nicht aus popstate!
  var asky=document.getElementById('panorama');
  asky.setAttribute('src','#'+panos[id].image);
  console.dir(panos[id].name);
  //cannot read property get of null!
  var acam=document.getElementById('cam');
  acam.setAttribute('rotation',panos[id].rotation);
  //console.dir(asky.getAttribute('src'));
  //remove tooltip
  var tooltip = document.getElementById('tooltip');
  tooltip.style.display = 'none';
  var mapdiv = document.getElementById('map');
  mapdiv.classList.add('hidden');
  var panodiv = document.getElementById('pano');
  panodiv.classList.remove('hidden');
  panodiv.classList.add('visible');
  //remove layers tab pane
  var ltab = document.getElementById('ltab');
  ltab.classList.add('hidden');
  //show map tab pane
  var mtab = document.getElementById('mtab');
  mtab.classList.remove('hidden');
  mtab.style.cursor = "pointer";
  //activate infospots tab
  //var spotstab = document.getElementById('spotstab');
  //spotstab.classList.remove('disabled');
  //show VR button
  var vrtab = document.getElementById('vrtab');
  vrtab.classList.remove('disabled');
  vrtab.style.cursor = "pointer";
  var sound=document.getElementById('insightsnd');
  //sound.play();
  currentPano=id;
}
var clickPanoramaFeature = function (pixel) {
  var feature = map.forEachFeatureAtPixel(pixel, function (feature) {
    return feature;
  });
  if (feature) {
    //console.dir(feature.getGeometry().getCoordinates());
    currentFeature=feature;
    var parts = 1;
    var called = false;
    function callback() {
      switchToPano(feature.get('id'));
    }
    previousZoom = mainview.getZoom();
    var zoom=feature.get('zoom');
    if ( zoom < 10) {
      console.dir(zoom);
      zoom=10;
    }
    mainview.animate({
        center: feature.getGeometry().getCoordinates(),
        duration: 2000,
        zoom: zoom,
      }, callback
    );
  }
}
map.on('singleclick', function (event) {
  clickPanoramaFeature(map.getEventPixel(event.originalEvent));
})
/*map.on('moveend', function (event) {
  //console.dir(transform(mainview.getCenter(), projection49911, projection49901));
})*/

//viewer.onAnimate(updatePanoLink());
var selectedLabel;
var renderPanViews = function() {
  var panoramas = document.getElementById('panoramas');
  var ul = document.createElement('ul');
  panoramas.appendChild(ul);
  for (const pano of panos){
    var li = document.createElement('li');
    li.id='pli-'+pano.id;
    var input = document.createElement('input');
    input.setAttribute('type','checkbox');
    input.disabled=true;
    input.style.visibility='hidden';
    li.appendChild(input);
    var label = document.createElement('label');
    label.innerHTML=pano.name;
    label.onclick=function(event) {
      for (const pano of panos){
        let loopli=document.getElementById('pli-'+pano.id);
        loopli.classList.remove('selected');
      }
      this.parentElement.classList.add('selected');
      var mapdiv=document.getElementById('map');
      var feature=poiSource.getFeatureById(pano.id);
      if (mapdiv.classList.contains('hidden')) {
        //inside pano, fist switch to map and zoom out
        sidebar.close();
        mapdiv.classList.remove('hidden');
        //disable pano canvas
        var panodiv = document.getElementById('pano');
        panodiv.classList.add('hidden');
        var asky=document.getElementById('panorama');
        asky.removeAttribute('src');
        var parts = 1;
        var called = false;
        function callback() {
          //geht nicht?
          //var delay = parts === 0 ? 0 : 1750;
          switchToPano(feature.get('id'));
        }
        if (mainview.getZoom()>11) {
          mainview.animate({
          //first zoom back out
            duration: 2000,
            zoom: 10,
          });
        }
        mainview.animate(
          {
            center: feature.getGeometry().getCoordinates(),
            zoom: feature.get('zoom')-1,
            duration: 2000          
          },
          {
            zoom: feature.get('zoom'),
            duration: 2000          
          },
          callback
        );
      } else {
        sidebar.close();
        var parts = 1;
        var called = false;
        function callback(complete) {
          switchToPano(feature.get('id'));
        }
        previousZoom = mainview.getZoom();
        var zoomTo=feature.get('zoom');
        //var viewZoom=view.getZoom();
        if ( mainview.getZoom()>11 ) {
          mainview.animate({
            duration: 2000,
            zoom: 10,
          });
        }
        mainview.animate(
        {
          center: feature.getGeometry().getCoordinates(),
          zoom: zoomTo-1,
          duration: 2000,
        },
        {
          duration: 2000,
          zoom: zoomTo,
        },
        callback
      );
      }
      
    }
    li.className = 'panorama';
    li.appendChild(label);
    ul.appendChild(li);
  }
}
renderPanViews();
window.addEventListener("wheel", event => {
    const delta = Math.sign(event.wheelDelta);
    //getting the mouse wheel change (120 or -120 and normalizing it to 1 or -1)
    var mycam=document.getElementById('camera').getAttribute('camera');
    var finalZoom=document.getElementById('camera').getAttribute('camera').zoom+delta;
    //limiting the zoom so it doesnt zoom too much in or out
    if(finalZoom<1)
      finalZoom=1;
    if(finalZoom>5)
      finalZoom=5;  

    mycam.zoom=finalZoom;
    //setting the camera element
    document.getElementById('camera').setAttribute('camera',mycam);
  });
