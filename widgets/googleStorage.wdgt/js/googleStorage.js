/*
 Leaderboard GSheet adapter for widgeds

 Created: Marielle Lange, 2011
 Distributed under the MIT (http://www.opensource.org/licenses/mit-license.php)

 Built on top of the widged library
 http://github.com/widged/widgeds
*/
;(function($){
   
   
   var plugin = {
      configMap: {},
      setup: function (selector, config) {
        var options = $.extend({}, plugin.defaults, config);
        if(options.form.fields == undefined) { options.form.fields = plugin.defaults.form.fields; }
        plugin.configMap[selector] = options;
      },

      defaults: {
	   	form: {
	   		"fields": {
               "classUid":         "entry.0.single",
               "userUid":         "entry.1.single",
               "activityUrl":     "entry.2.single",
               "activityUid":     "entry.3.single",
               "activityData":       "entry.4.single",
	   		}
	   	},
	   	uid: undefined,
	   	studentName: undefined
	   },


   update: function(selector, data) {
		var options = plugin.configMap[selector];
           var studentName = $("#studentName").val(); 
           var url = $(location).attr('href');
           $.extend(data,{url: url, classId: 1, user: options.studentName, uid: options.uid });
           plugin.postData(selector, data);
	},
	
	postData: function(selector, data) {
		var options = plugin.configMap[selector];
	    var param =   {
	    		"formkey": options.form.formkey,
	    		"pageNumber": 0,
	    		"backupCache": ""
	    	};

        param[options.form.fields["classUid"]]        = data.classId;
		param[options.form.fields["userUid"]]         = data.user;
		param[options.form.fields["activityUrl"]]     = data.url;
		param[options.form.fields["activityUid"]]     = data.uid;
		param[options.form.fields["activityData"]]    = data.data;
	
		var jqxhr = $.get("https://spreadsheets.google.com/formResponse" + "?" + $.param(param), function() {
			// alert("success");
		})
		.complete(function(data) { plugin.gsheetComplete(selector, data); });
	
	},
	
    gsheetComplete: function(selector, data) {
    	console.log('data saved', selector, data);
    }
   }
    
   if(!window.widged){window.widged={};}//We create a shortcut for our framework, we can call the methods by $$.method();
   $.extend(true, window.widged, {activitydata_gsheet: plugin});
})(jQuery);
