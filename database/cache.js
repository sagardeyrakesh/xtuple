/*jshint node:true, bitwise:true, indent:2, curly:true eqeqeq:true, immed:true, latedef:true, newcap:true, noarg:true,
regexp:true, undef:true, strict:true, trailing:true, white:true */
/*global XT:true */

(function () {
  "use strict";

  var _path = XT.path, _ = XT._, mongoose = XT.mongoose;

  XT.Cache = XT.Object.extend({
    /** @lends XT.cache */

    init: function () {
      var schemaFiles, i, host, port, schemaDir;

      host = XT.options.cache.hostname || "localhost";
      port = XT.options.cache.port || 27017;
      schemaDir = XT.options.cache.schemaDirectory;
      this.set("hostname", host);
      this.set("port", port);
      this.set("schemaDir", schemaDir);

      this.connection = mongoose.createConnection(this.get("conString"));
      
      schemaFiles = this.get("schemaFiles");

      if (!schemaFiles || schemaFiles.length <= 0) {
        XT.warn("no mongo schemas available!");
      } else {
        for (i = 0; i < schemaFiles.length; ++i) {
          require(schemaFiles[i]);
        }
      }

      // catch SIGINT to close connection but don't
      // run it multiple times
      XT.addCleanupTask(_.bind(this.cleanup, this));
    },

    conString: function () {
      return "mongodb://%@:%@/xtdb".f(this.get("hostname"), this.get("port"));
    }.property(),

    cleanup: function () {
      if (this.connection) {
        this.connection.close();
      }
    },
    
    connection: null,
    
    model: function (name) {
      var schemas = this.get("schemas"), schema = "%@Schema".f(name),
          models = this.get("models"), con = this.get("connection"), K;
      if (!models[schema]) {
        K = models[schema] = models[name] = con.model(name, schemas[schema]);
      } else { K = models[schema]; }
      return K;
    },

    models: function () {
      return XT.models || (XT.models = {});
    }.property(),

    schemas: function () {
      return XT.schemas || (XT.schemas = {});
    }.property(),
    
    schemaDir: function () {
      return this.schemaDirectory;
    }.property(),

    schemaFiles: function () {
      var dir, schemaFiles;
      if (this._schemaFiles) {
        return this._schemaFiles;
      }
      dir = _path.join(XT.basePath, this.get("schemaDir"));
      schemaFiles = this._schemaFiles = XT.directoryFiles(dir, {extension: "js", fullPath: true});
      return schemaFiles;
    }.property()
  });
  
  XT.run(function () {
    XT.cache = XT.Cache.create();
  });
  
}());
