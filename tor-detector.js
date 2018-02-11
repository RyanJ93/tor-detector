const filesystem = require('fs');
const https = require('https');
const net = require('net');

var TorDetector = {
	/**
	* @var String listPath A string containing the path to the file that contains a list of Tor exit points separated by a breakline (\n).
	*/
	listPath: null,
	
	/**
	* @var String list A string containing the content of the list, if it is going to be cached for next uses.
	*/
	list: null,
	
	/**
	* @var Boolean cache If set to "true", the content of the list will be cached for next uses, otherwise not.
	*/
	cache: false,
	
	/**
	* Sets the path to the list file, this method is chainable.
	*
	* @param String path A string containing the path to the list.
	*
	* @throws exception If an invalid file path is provided. 
	*/
	setListPath: function(path){
		if ( typeof(path) !== 'string' ){
			throw 'Invalid path.';
		}
		if ( path === '' ){
			path = null;
		}
		if ( this.listPath !== path ){
			this.list = this.cache === false ? null : '';
			this.listPath = path;
		}
		return this;
	},
	
	/**
	* Returns the path to the list.
	*
	* @return String A string containing the path to the list.
	*/
	getListPath: function(){
		return this.listPath === '' || typeof(this.listPath) !== 'string' ? null : this.listPath;
	},
	
	/**
	* Sets if the list cache shall be used or not, this method is chainable.
	*
	* @param Boolean value If set to "true", the content of the list will be cached for next uses, otherwise not.
	*/
	setListCache: function(value){
		if ( value !== true ){
			this.cache = false;
			this.list = null;
			return this;
		}
		this.cache = true;
		return this;
	},
	
	/**
	* Returns if the list cache is enabled or not.
	*
	* @return Boolean If the list cache is enabled will be returned "true", otherwise "false".
	*/
	getListCache: function(){
		return this.cache === false ? false : true;
	},
	
	/**
	* Cleares the content of the list cache, this method is chainable.
	*/
	invalidateDictionaryCache: function(){
		this.list = null;
		return this;
	},
	
	/**
	* Loads the content of the list that has been set.
	*
	* @param Boolean asynchronous If set to "false" the operation will be done in synchronous way, otherwise in asynchronous way with promise support.
	*
	* @throws exception If an error occurs while reading list contents.
	*/
	loadDictionaryCache: function(asynchronous){
		if ( asynchronous !== false ){
			return new Promise(function(resolve, reject){
				resolve(TorDetector.loadDictionaryCache(false));
			});
		}
		if ( this.cache === false || this.listPath === '' || typeof(this.listPath) !== 'string' ){
			return false;
		}
		try{
			let content = filesystem.readFileSync(__dirname + '/' + this.listPath).toString();
			if ( content === '' ){
				return false;
			}
			this.list = content;
			return true;
		}catch(ex){
			console.log(ex);
			throw 'Unable to load the list.';
		}
	},
	
	/**
	* Updates the content of the list by downloading a new list of Tor exit points, this method is asynchronous and will return a promise used to handle method success or failure.
	*
	* @throws exception If no file path has been set previously.
	* @throws exception If an error occurs while writing the file.
	* @throws exception If an error occurs while downloading the data.
	*/
	updateFile: function(){
		return new Promise(function(resolve, reject){
			if ( typeof(TorDetector.listPath) !== 'string' || TorDetector.listPath === '' ){
				throw 'No path has been set.';
			}
			https.get('https://check.torproject.org/exit-addresses', function(response){
				response.setEncoding('UTF-8');
				let content = '';
				response.on('data', function(data){
					content += data;
				});
				response.on('end', function(data){
					content = content.split('\n');
					let list = '';
					for ( let i = 0 ; i < content.length ; i++ ){
						if ( content[i].indexOf('ExitAddress') !== 0 ){
							continue;
						}
						let buffer = content[i].substr(content[i].indexOf(' ') + 1);
						if ( buffer === '' ){
							continue;
						}
						list += list === '' ? buffer.substr(0, buffer.indexOf(' ')).toLowerCase() : ( '\n' + buffer.substr(0, buffer.indexOf(' ')).toLowerCase() );
					}
					try{
						filesystem.writeFileSync(__dirname + '/' + TorDetector.listPath, list);
						resolve();
					}catch(ex){
						throw 'Unable to save the file.';
					}
				});
				response.on('error', function(){
					throw 'An error occurred while getting the data.';
				});
			});
		});
	},
	
	/**
	* Returns the client's IP address.
	*
	* @param Object request The object that represent the connection with the client.
	* @param Boolean proxy If set to "false" will be returned the IP address found in the request, otherwise will be checked for proxy presence, if a proxy were found, will be returned the IP of the client that is using this proxy.
	*
	* @return String A string containing the client's IP address, if no valid IP address were found, will be returned null.
	*/
	getClientIPAddress: function(request, proxy){
		if ( proxy !== false ){
			if ( typeof(request.headers['x-forwarded-for']) === 'string' && request.headers['x-forwarded-for'] !== '' ){
				let address = request.headers['x-forwarded-for'].split(',').pop().trim();
				if ( net.isIP(address) !== 0 ){
					return address.toLowerCase();
				}
			}
		}
		if ( typeof(request.connection.remoteAddress) === 'string' && request.connection.remoteAddress !== '' ){
			let address = request.connection.remoteAddress.trim();
			if ( net.isIP(address) !== 0 ){
				return address.toLowerCase();
			}
		}
		if ( typeof(request.socket.remoteAddress) === 'string' && request.socket.remoteAddress !== '' ){
			let address = request.socket.remoteAddress.trim();
			if ( net.isIP(address) !== 0 ){
				return address.toLowerCase();
			}
		}
		if ( typeof(request.connection.socket.remoteAddress) === 'string' && request.connection.socket.remoteAddress !== '' ){
			let address = request.connection.socket.remoteAddress.trim();
			if ( net.isIP(address) !== 0 ){
				return address.toLowerCase();
			}
		}
		return null;
	},
	
	/**
	* Checks if a given IP address is assigned to a Tor exit point or not: basically, checks if a client is using Tor or not.
	*
	* @param String address A string containing the IP address to check.
	* @param Boolean asynchronous If set to "false" the operation will be done in synchronous way, otherwise in asynchronous way with promise support.
	*
	* @throws exception If the given IP address is not valid.
	* @throws exception If no file path has been set previously.
	* @throws exception If the list read from the file is empty.
	* @throws exception If an error occurs while reading the content from the file.
	*/
	isTor: function(address, asynchronous){
		if ( asynchronous !== false ){
			return new Promise(function(resolve, reject){
				resolve(TorDetector.isTor(address, false));
			});
		}
		if ( typeof(address) !== 'string' || address === '' || net.isIP(address) === 0 ){
			throw 'Invalid IP address.';
		}
		if ( typeof(TorDetector.listPath) !== 'string' || TorDetector.listPath === '' ){
			throw 'No path has been set.';
		}
		address = address.toLowerCase();
		if ( TorDetector.cache === true && typeof(TorDetector.list) === 'string' ){
			return TorDetector.list.indexOf(address + '\n') >= 0 || TorDetector.list.indexOf('\n' + address) >= 0 || TorDetector.list === address ? true : false;
		}
		try{
			let content = filesystem.readFileSync(__dirname + '/' + TorDetector.listPath).toString();
			if ( content === '' ){
				throw 'The given list is empty.';
			}
			if ( TorDetector.cache === true ){
				TorDetector.list = content;
			}
			return content.indexOf(address + '\n') >= 0 || content.indexOf('\n' + address) >= 0 ? true : false;
		}catch(ex){
			throw 'An error occurred while reading the file content.';
		}
	}
}

module.exports = TorDetector;