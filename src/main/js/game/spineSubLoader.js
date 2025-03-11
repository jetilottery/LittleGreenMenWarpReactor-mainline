/**
 * @module SpineSubLoader
 * @description This module is used to load Spine asset files
 * @author Kent Murray
 */
define([
	'com/pixijs/pixi',
	'skbJet/component/resourceLoader/Util',
	'skbJet/component/resourceLoader/AbstractSubLoader',
	'skbJet/component/resourceLoader/resourceLib'

], function(PIXI, Util, AbstractSubLoader, resLib ){

	resLib.spine = resLib.spine||{};

	function SpineSubLoader(options){
		options = options||{};
		this._initOptions('spine', options);
	}

	SpineSubLoader.prototype = new AbstractSubLoader();

	SpineSubLoader.prototype._load = SpineSubLoader.prototype.load;

	/**
	 * @function load
	 * @description load files, override and wrapper abstract sub loader load.
	 * @instance
	 * @param fileMap {string} - the file map to be loaded, key is file URL, value is parent URL
	 * @param options {map} - Options
	 * @param options.queryStr {string} - Optional, query string which will be appended to the end of URL
	 * @param options.onFileLoaded {function} - call back when file loaded
	 * @param options.onLoadFailed {function} - call back when file load failed
	 */
	SpineSubLoader.prototype.load = function(fileMap, options){
		this.loader = new PIXI.loaders.Loader();
		this.loader.defaultQueryString = '';
		options.queryStr = null;
		this._load(fileMap, options);
		var This = this;
		this.loader.on('load', function(loader, resource){
			if(resource.spineData){
				resLib.spine[resource.name] = resource;
			}
			This._count.current++;
			This.options.onFileLoaded();
		});
		this.loader.once('complete', function(){
			if(This._count.current === This._count.total){
				This._count.complete = true;
				This.options.onFileLoaded();
			}
		});
		this.loader.on('error', this.options.onLoadFailed);
		this.loader.load();
	};

	SpineSubLoader.prototype._doLoadFile = function(url/*, success, fail*/){
		if(Util.getFileExt(url).toString() === 'json')
		{
			var name = Util.getFileNameWithoutExt(url);
			this.loader.add(name, url);
		}
	};

	return SpineSubLoader;
});