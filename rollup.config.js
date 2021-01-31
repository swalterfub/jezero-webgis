import inject from '@rollup/plugin-inject';
import replace from 'rollup-plugin-re';
import legacy from '@rollup/plugin-legacy';

export default {
  input: 'node_modules/sidebar-v2/js/ol3-sidebar.js',
  output: {
    file: 'node_modules/sidebar-v2/js/ol3-sidebar.mjs',
    format: 'es',
  },
  plugins: [
    replace({
      patterns: [
        // Initial declaration
        {
          test: 'ol.control.Sidebar = ',
          replace: 'var Sidebar = ',
        },
        // Instance properties
        {
          test: 'ol.control.Sidebar.prototype',
          replace: 'Sidebar.prototype',
        },
        // Inheritance - reference to constructor
        {
          test: 'ol.control.Sidebar;',
          replace: 'Sidebar;',
        },
        // Remove dotted namespace to allow inject to replace
        // Control occurances
        {
          test: 'ol\.control\.Control',
          replace: 'Control',
        },
	// Replace ol.inherits which no longer exists in ol v6
	// manually remove if statement
	{
	  test: 'ol\.inherits(ol\.control\.Sidebar, ol\.control\.Control);',
	  replace: 'Sidebar.prototype = Object.create(Control.prototype);\nSidebar.prototype.constructor = Sidebar;'
	}
      ],
    }),
    // Adds import statement
    inject({
      'Control': 'ol/control/Control',
      include: './node_modules/sidebar-v2/js/ol3-sidebar.js'
    }),
    // Adds default export statement
    legacy({ './node_modules/sidebar-v2/js/ol3-sidebar.js': 'Sidebar' }),
  ],
};
