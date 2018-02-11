# Tor detector

A very simple library to detect Tor connections using Node.js without any dependency.

# Usage

Before using the library, you have to set the path to the file that contains the list of all Tor exit points, if you don't have the list you can set an arbitrary file name instead.
To set the library path, use this method:

`TorDetector.setListPath('nodes.txt');`

If the file doesn't exist or is empty or you just want to update its content, you can use this method to download the updated list and overwrite new list in the file:

`TorDetector.updateFile().then(function(){}).catch(function(error){});`

Once you have the list, you can check if an IP address is part of the Tor network by using this method:

`TorDetector.isTor('IP ADDRESS HERE', false).then(function(){}).catch(function(error){});`

This method can be used both in synchronous and asynchronous way.
If you are running a server and want to get the IP address of the client you can use this method:

`TorDetector.getClientIPAddress(request);`

Are you looking for the PHP version? Give a look [here](https://github.com/RyanJ93/php-tor-detector).