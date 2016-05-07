// Init JitsiMeetJS
JitsiMeetJS.init(CONFIG);

function connect() {
	CONFIG.bosh += '?room=' + DEFAULT_ROOM;
	var connection = new JitsiMeetJS.JitsiConnection(null, null, CONFIG);

	connection.addEventListener(JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED, onConnectionSuccess);
	connection.addEventListener(JitsiMeetJS.events.connection.CONNECTION_FAILED, onConnectionFailed);

	connection.connect();
}

//Callbacks
function onConnectionSuccess() {
	console.log('CONNECTED TO SERVER SUCCESSFULY');
}

function onConnectionFailed() {
	console.log('CONNECTION TO SERVER FAILED');
}

connect();