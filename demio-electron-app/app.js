JitsiMeetJS.init(CONFIG);

var conection = null;
var room = null;
var isJoined = false;
var remoteTracks = {};
var localTracks = [];
var isPresenter = false;

function start() {
  // Check user status
  var remote = require('electron').remote;
  var appPath = remote.app.getPath('home');
  var path = require('path');
  var p = path.join(appPath + '/.presenter');
  var fs = require('fs');
  fs.exists(p, function(exists) {
    if (exists) {
    	isPresenter = true
    } else {
    	$("#wait-screen")[0].style.display = "block";
    }
    connect();
  });
}

function connect() {
	connection = new JitsiMeetJS.JitsiConnection(null, null, CONFIG);

	connection.addEventListener(JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED, onConnectionSuccess);
	connection.addEventListener(JitsiMeetJS.events.connection.CONNECTION_FAILED, onConnectionFailed);
	connection.addEventListener(JitsiMeetJS.events.connection.CONNECTION_DISCONNECTED, disconnect);
	connection.connect();
}

function disconnect(){
    console.log("disconnect!");
    connection.removeEventListener(JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED, onConnectionSuccess);
    connection.removeEventListener(JitsiMeetJS.events.connection.CONNECTION_FAILED, onConnectionFailed);
    connection.removeEventListener(JitsiMeetJS.events.connection.CONNECTION_DISCONNECTED, disconnect);
}

//Callbacks
function onUserLeft(id) {
    console.log("user left");
    if(!remoteTracks[id])
        return;
    var tracks = remoteTracks[id];
    $("#wait-screen")[0].style.display = "block";
    for(var i = 0; i< tracks.length; i++) {
    	tracks[i].detach($("#" + id + tracks[i].getType() + (i+1))[0]);
    	$("#" + id + tracks[i].getType() + (i+1))[0].remove();
    }
}

function onConnectionSuccess() {
	console.log('CONNECTED TO SERVER SUCCESSFULY');
	CONFIG.bosh += '?room=' + DEFAULT_ROOM;
	room = connection.initJitsiConference(DEFAULT_ROOM, CONF_OPTIONS);
	room.on(JitsiMeetJS.events.conference.CONFERENCE_JOINED, onConferenceJoined);
	room.on(JitsiMeetJS.events.conference.TRACK_ADDED, onRemoteTrack);
	room.on(JitsiMeetJS.events.conference.USER_LEFT, onUserLeft);
	room.join();
}

function onRemoteTrack(track) {
	if(track.isLocal() || !track.stream)
	    return;
	var participant = track.getParticipantId();
	if(!remoteTracks[participant])
	    remoteTracks[participant] = [];
	
	$("#wait-screen")[0].style.display = "none";
	var idx = remoteTracks[participant].push(track);
	var id = participant + track.getType() + idx;
	if(track.getType() == "video") {
	    $("body").append("<video autoplay='1' id='" + participant + "video" + idx + "' />");
	} else {
	    $("body").append("<audio autoplay='1' id='" + participant + "audio" + idx + "' />");
	}
	track.attach($("#" + id)[0]);
}

function onConnectionFailed() {
	console.log('CONNECTION TO SERVER FAILED');
}

function onConferenceJoined() {
	console.log('CONFERENCE JOINED');
	isJoined = true;
	if (isPresenter)
		JitsiMeetJS.createLocalTracks({devices: ["desktop", "audio"]}).then(onLocalTracks);
}

function onLocalTracks(tracks) {
	localTracks = tracks;
	for(var i = 0; i < localTracks.length; i++)
	{
	    if(localTracks[i].getType() == "video") {
	        $("body").append("<video autoplay='1' id='localVideo" + i + "' />");
	        localTracks[i].attach($("#localVideo" + i)[0]);
	    } else {
	        $("body").append("<audio autoplay='1' muted='true' id='localAudio" + i + "' />");
	        localTracks[i].attach($("#localAudio" + i)[0]);
	    }
	    if(isJoined)
	        room.addTrack(localTracks[i]);
	}
}

start();