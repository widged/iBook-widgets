// The main Khan Module
var testMode = false;
var urlBase = "../";
var decor = "iBookWidget";

jQuery.fn.extend({
  // Pick a random element from a set of elements
  getRandom: function() {
    return this.eq( Math.floor( this.length * KhanUtil.random() ) );
  },

  // Run the methods provided by a module against some elements
  runModules: function( problem, type ) {
    var clone = problem.clone();
    type = type || "";

    var info = {
      testMode: false
    };


    return this.each(function( i, elem ) {
      elem = jQuery( elem );
      var elemClone = elem.clone();

      // Run the main method of any modules
      // loop through answer-types, tmpl, underscode, jquery.adhesion, math, raphael, then the required ones (e.g., graphie, graphie-helpers-arithmetic, word-problems).
      jQuery.each( Khan.modules, function( src, mod ) {
        var name = mod.name;
        if ( jQuery.fn[ name + type ] ) {
          elem[ name + type ]( problem, info );
        }
      });
    });
  }
});


var Khan = (function() {

	var randomSeed;

	var KhanInterface = {
		modules: {},
		moduleDependencies: {

			"math": [ 
				{ src: urlBase + "utils/MathJax/1.1a/MathJax.js?config=KAthJax-77111459c7d82564a705f9c5480e2c88" }, 
				"raphael" 
			],

			// Load Raphael locally because IE8 has a problem with the 1.5.2 minified release
			// http://groups.google.com/group/raphaeljs/browse_thread/thread/c34c75ad8d431544

			// The normal module dependencies.
			"calculus": [ "math", "expressions", "polynomials" ],
			"exponents": [ "math", "math-format" ],
			"kinematics": [ "math" ],
			"math-format": [ "math", "expressions" ],
			"polynomials": [ "math", "expressions" ],
			"stat": [ "math" ],
			"word-problems": [ "math" ],
			"derivative-intuition": [ "jquery.mobile.vmouse" ],
			"unit-circle": [ "jquery.mobile.vmouse" ],
			"interactive": [ "jquery.mobile.vmouse" ],
			"mean-and-median": [ "stat" ]
		},

		require: function( mods ) {

			if ( mods == null ) {
				return;
			} else if ( typeof mods === "string" ) {
				mods = mods.split( " " );
			} else if ( !jQuery.isArray( mods ) ) {
				mods = [ mods ];
			}

			jQuery.each(mods, function( i, mod ) {
				var src, deps;

				if ( typeof mod === "string" ) {
					var cachebust = "";
					if ( testMode && Khan.query.nocache != null ) {
						cachebust = "?" + Math.random();
					}
					src = urlBase + "utils/" + mod + ".js" + cachebust;
					deps = Khan.moduleDependencies[ mod ];
					mod = {
						src: src,
						name: mod
					};
				} else {
					src = mod.src;
					deps = mod.dependencies;
					delete mod.dependencies;
				}

				if ( !Khan.modules[ src ] ) {
					Khan.modules[ src ] = mod;
					Khan.require( deps );
				}
			});
		},

		// Populate this with modules
		Util: {
			// http://burtleburtle.net/bob/hash/integer.html
			// This is also used as a PRNG in the V8 benchmark suite
			random: function() {
				// Robert Jenkins' 32 bit integer hash function.
				var seed = randomSeed;
				seed = ( ( seed + 0x7ed55d16 ) + ( seed << 12 ) ) & 0xffffffff;
				seed = ( ( seed ^ 0xc761c23c ) ^ ( seed >>> 19 ) ) & 0xffffffff;
				seed = ( ( seed + 0x165667b1 ) + ( seed << 5 ) ) & 0xffffffff;
				seed = ( ( seed + 0xd3a2646c ) ^ ( seed << 9 ) ) & 0xffffffff;
				seed = ( ( seed + 0xfd7046c5 ) + ( seed << 3 ) ) & 0xffffffff;
				seed = ( ( seed ^ 0xb55a4f09 ) ^ ( seed >>> 16 ) ) & 0xffffffff;
				return ( randomSeed = ( seed & 0xfffffff ) ) / 0x10000000;
			}
		},

		convertProblem: function($problem, $exercise) {
			// Load module dependencies
			Khan.loadScripts( 
				jQuery.map(  Khan.modules, function( mod, name ) { return mod; } ), 
				function() {
				console.log("[before]", $problem)
				// Run the main method of any modules
				$problem.runModules( $problem, "Load" );
				$problem.runModules( $problem );
				var exerciseUrl = urlBase + "decor/" + decor + "/exercise.html";
				$exercise.append("ajax call", exerciseUrl);
				jQuery.ajax( {
					url: exerciseUrl,
					dataType: "text",
					// ok, this doesn't work when on the iPad. If they got rid of the iFrame they may 
					// as well prevent dynamic page loading. 
					success: function( htmlExercise ) {
						console.log("success")
						$exercise.append("success");
						handleInject( html, htmlExercise );

					}
				});

				}
			);

		},		

		// Load in a collection of scripts, execute callback upon completion
		loadScripts: function( urls, callback ) {
			var loaded = 0,
				loading = urls.length,
				head = document.getElementsByTagName('head')[0];

			callback || ( callback = function() { } );

			for ( var i = 0; i < loading; i++ ) { (function( mod ) {

				if ( !testMode && mod.src.indexOf("/khan-exercises/") === 0 && mod.src.indexOf("/MathJax/") === -1 ) {
					// Don't bother loading khan-exercises content in production
					// mode, this content is already packaged up and available
					// (*unless* it's MathJax, which is silly still needs to be loaded)
					loaded++;
					return;
				}

				// Adapted from jQuery getScript (ajax/script.js)
				var script = document.createElement("script");
				script.async = "async";

				for ( var prop in mod ) {
					script[ prop ] = mod[ prop ];
				}

				script.onerror = function() {
					// No error in IE, but this is mostly for debugging during development so it's probably okay
					// http://stackoverflow.com/questions/2027849/how-to-trigger-script-onerror-in-internet-explorer
					Khan.error( "Error loading script " + script.src );
				};

				script.onload = script.onreadystatechange = function() {
					if ( !script.readyState || ( /loaded|complete/ ).test( script.readyState ) ) {
						// Handle memory leak in IE
						script.onload = script.onreadystatechange = null;

						// Remove the script
						if ( script.parentNode ) {
							script.parentNode.removeChild( script );
						}

						// Dereference the script
						script = undefined;

						runCallback();
					}
				};

				head.appendChild(script);
			})( urls[i] ); }

			runCallback( true );

			function runCallback( check ) {
				if ( check !== true ) {
					loaded++;
				}

				if ( callback && loading === loaded ) {
					callback();
				}
			}
		},

	};
	return KhanInterface;
}());

// Make this publicly accessible
var KhanUtil = Khan.Util;

