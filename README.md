# jezero-webgis
`npx rollup --config`
Dann in node_modules/sidebar-v2/js/ol3-sidebar.mjs:
```
if ('inherits' in ol) {
    Sidebar.prototype = Object.create(Control.prototype);
Sidebar.prototype.constructor = Sidebar;
} else {
    Sidebar.prototype = Object.create(Control.prototype);
    Sidebar.prototype.constructor = Sidebar;
}
```
aendern in:
```
Sidebar.prototype = Object.create(Control.prototype);
Sidebar.prototype.constructor = Sidebar;
```
