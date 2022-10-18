# jezero-webgis

## instructions

npm install, then:

`npx rollup --config`

Then change the following in node_modules/sidebar-v2/js/ol3-sidebar.mjs:
```
if ('inherits' in ol) {
    Sidebar.prototype = Object.create(Control.prototype);
Sidebar.prototype.constructor = Sidebar;
} else {
    Sidebar.prototype = Object.create(Control.prototype);
    Sidebar.prototype.constructor = Sidebar;
}
```
change to:
```
Sidebar.prototype = Object.create(Control.prototype);
Sidebar.prototype.constructor = Sidebar;
```
then `npm run`
