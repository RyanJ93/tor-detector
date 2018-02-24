const TorDetector = require('tor-detector');

let address = '89.234.157.254';

//Set the list path.
TorDetector.setListPath(__dirname + '/nodes.txt');

//Update the content fo the list (or create the list if the file doesn't exist or is empty).
TorDetector.updateFile().then(function(){
	console.log('Node list refreshed.');
	
	//Check if this IP address is a Tor exit point.
	let result = TorDetector.isTor(address, false);
	console.log('Is this client (' + address + ') part of the Tor network? ' + ( result === true ? 'Yes' : 'No' ) + '.');
	
	//Check if this IP address if a Tor exit point (in asynchronous way).
	TorDetector.isTor(address).then(function(result){
		console.log('Is this client (' + address + ') part of the Tor network? ' + ( result === true ? 'Yes' : 'No' ) + '.');
	}).catch(function(error){
		console.log(error);
	});
}).catch(function(error){
	console.log(error);
});