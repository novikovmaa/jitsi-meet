# Manual Installation

## 1. Install Prosody
```
sudo apt-get update
sudo apt-get install prosody
```

## 1.1 Update prosody config
```
cd /etc/prosody/conf.avail
sudo vi /etc/prosody/conf.avail/ec2-52-51-12-4.eu-west-1.compute.amazonaws.com.cfg.lua
```
###### Add this lines to config
```
VirtualHost "ec2-52-51-12-4.eu-west-1.compute.amazonaws.com"
    authentication = "anonymous"
    ssl = {
        key = "/var/lib/prosody/ec2-52-51-12-4.eu-west-1.compute.amazonaws.com.key";
        certificate = "/var/lib/prosody/ec2-52-51-12-4.eu-west-1.compute.amazonaws.com.crt";
    }
    modules_enabled = {
        "bosh";
        "pubsub";
    }

VirtualHost "auth.ec2-52-51-12-4.eu-west-1.compute.amazonaws.com"
    authentication = "internal_plain"

admins = { "focus@auth.ec2-52-51-12-4.eu-west-1.compute.amazonaws.com" }

Component "conference.ec2-52-51-12-4.eu-west-1.compute.amazonaws.com" "muc"
Component "jitsi-videobridge.ec2-52-51-12-4.eu-west-1.compute.amazonaws.com"
    component_secret = "YOURSECRET1"
Component "focus.ec2-52-51-12-4.eu-west-1.compute.amazonaws.com"
    component_secret = "YOURSECRET2"
```

## 2. Add link to this config and generate self-signed certificates

```
sudo ln -s /etc/prosody/conf.avail/ec2-52-51-12-4.eu-west-1.compute.amazonaws.com.cfg.lua /etc/prosody/conf.d/ec2-52-51-12-4.eu-west-1.compute.amazonaws.com.cfg.lua
sudo prosodyctl cert generate ec2-52-51-12-4.eu-west-1.compute.amazonaws.com
sudo prosodyctl register focus auth.ec2-52-51-12-4.eu-west-1.compute.amazonaws.com YOURSECRET3
sudo prosodyctl stop
```

## 3. Install nginx

```
sudo apt-get install nginx
sudo apt-get install git
cd /etc/nginx/sites-available
sudo vi ec2-52-51-12-4.eu-west-1.compute.amazonaws.com
```

## 3.1 Update nginx config with this lines

```
server_names_hash_bucket_size 64;

server {
    listen 80;
    listen 443 ssl;
    ssl_certificate /var/lib/prosody/ec2-52-51-12-4.eu-west-1.compute.amazonaws.com.crt;
    ssl_certificate_key /var/lib/prosody/ec2-52-51-12-4.eu-west-1.compute.amazonaws.com.key;
    server_name ec2-52-51-12-4.eu-west-1.compute.amazonaws.com;
    # set the root
    root /srv/ec2-52-51-12-4.eu-west-1.compute.amazonaws.com;
    index index.html;
    location ~ ^/([a-zA-Z0-9=\?]+)$ {
        rewrite ^/(.*)$ / break;
    }
    location / {
        ssi on;
    }
    # BOSH
    location /http-bind {
        proxy_pass      http://localhost:5280/http-bind;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header Host $http_host;
    }
}
```
###### Add nginx config to sites-enabled directory
```
cd /etc/nginx/sites-enabled
sudo ln -s ../sites-available/ec2-52-51-12-4.eu-west-1.compute.amazonaws.com ec2-52-51-12-4.eu-west-1.compute.amazonaws.com
```

## 4. Install videobridge

```
cd ~
wget https://download.jitsi.org/jitsi-videobridge/linux/jitsi-videobridge-linux-x86-728.zip
sudo apt-get install unzip
unzip jitsi-videobridge-linux-x86-728.zip
sudo apt-get install default-jdk
mkdir ~/.sip-communicator
cd ~/.sip-communicator/
```
## 4.1 Add config to sip-communicator file
```
vi sip-communicator.properties
```
Add this line:
```
org.jitsi.impl.neomedia.transform.srtp.SRTPCryptoContext.checkReplay=false
```

## 5. Install jicofo

```
cd ~
git clone https://github.com/jitsi/jicofo.git
sudo apt-get install maven
mvn dependency:get -DartifactId=maven-ant-tasks -DgroupId=org.apache.maven -Dversion=2.1.3 -DrepoUrl=http://repo1.maven.org/maven2
mvn package -DskipTests -Dassembly.skipAssembly=false
/home/ubuntu/jicofo/target
unzip jicofo-linux-x64-1.0-SNAPSHOT.zip
```

###### Edit rc.local to autostart service jvb
Replace content of this file:
```
sudo vi /etc/rc.local
```

With this lines:
```
#!/bin/sh
#
# rc.local
#
# This script is executed at the end of each multiuser runlevel.
# Make sure that the script will "exit 0" on success or any other
# value on error.
#
# In order to enable or disable this script just change the execution
# bits.
#
# By default this script does nothing.

screen -d -m bin/bash /home/ubuntu/jitsi-videobridge-linux-x86-728/jvb.sh --host=localhost --domain=ec2-52-51-12-4.eu-west-1.compute.amazonaws.com --port=5347 --secret=YOURSECRET1 </dev/null >> /var/log/jvb.log 2>&1 12346
screen -d -m bin/bash /home/ubuntu/jicofo/target/jicofo-linux-x64-1.0-SNAPSHOT/jicofo.sh --host=localhost --domain=ec2-52-51-12-4.eu-west-1.compute.amazonaws.com --secret=YOURSECRET2 --user_domain=auth.ec2-52-51-12-4.eu-west-1.compute.amazonaws.com --user_name=focus --user_password=YOURSECRET3 </dev/null >> /var/log/jicofo.log 2>&1 12345

exit 0

```

```
sudo reboot
```

## 6. Deploy JitsiMeet

```
cd /srv/
sudo git clone https://github.com/jitsi/jitsi-meet.git
mv jitsi-meet/ ec2-52-51-12-4.eu-west-1.compute.amazonaws.com
cd ec2-52-51-12-4.eu-west-1.compute.amazonaws.com/
```

## 6.1 Update jitsi meet config with lines below
```
sudo vi ./config.js
```

```
/* jshint -W101 */
var config = {
//    configLocation: './config.json', // see ./modules/HttpConfigFetch.js
    hosts: {
        domain: 'ec2-52-51-12-4.eu-west-1.compute.amazonaws.com',
        //anonymousdomain: 'guest.example.com',
        //authdomain: 'jitsi-meet.example.com',  // defaults to <domain>
        muc: 'conference.ec2-52-51-12-4.eu-west-1.compute.amazonaws.com', // FIXME: use XEP-0030
        bridge: 'jitsi-videobridge.ec2-52-51-12-4.eu-west-1.compute.amazonaws.com', // FIXME: use XEP-0030
        //jirecon: 'jirecon.jitsi-meet.example.com',
        //call_control: 'callcontrol.jitsi-meet.example.com',
        //focus: 'focus.jitsi-meet.example.com', // defaults to 'focus.jitsi-meet.example.com'
    },
//  getroomnode: function (path) { return 'someprefixpossiblybasedonpath'; },
//  useStunTurn: true, // use XEP-0215 to fetch STUN and TURN server
//  useIPv6: true, // ipv6 support. use at your own risk
    useNicks: false,
    bosh: '//ec2-52-51-12-4.eu-west-1.compute.amazonaws.com/http-bind', // FIXME: use xep-0156 for that
    clientNode: 'http://jitsi.org/jitsimeet', // The name of client node advertised in XEP-0115 'c' stanza
    //focusUserJid: 'focus@auth.jitsi-meet.example.com', // The real JID of focus participant - can be overridden here
    //defaultSipNumber: '', // Default SIP number

    // Desktop sharing method. Can be set to 'ext', 'webrtc' or false to disable.
    desktopSharingChromeMethod: 'ext',
    // The ID of the jidesha extension for Chrome.
    desktopSharingChromeExtId: 'gimieicaihchnefkllolcmigancdlclc',
    // The media sources to use when using screen sharing with the Chrome
    // extension.
    desktopSharingChromeSources: ['screen', 'window'],
    // Required version of Chrome extension
    desktopSharingChromeMinExtVersion: '0.1',

    // The ID of the jidesha extension for Firefox. If null, we assume that no
    // extension is required.
    desktopSharingFirefoxExtId: null,
    // Whether desktop sharing should be disabled on Firefox.
    desktopSharingFirefoxDisabled: true,
    // The maximum version of Firefox which requires a jidesha extension.
    // Example: if set to 41, we will require the extension for Firefox versions
    // up to and including 41. On Firefox 42 and higher, we will run without the
    // extension.
    // If set to -1, an extension will be required for all versions of Firefox.
    desktopSharingFirefoxMaxVersionExtRequired: -1,
    // The URL to the Firefox extension for desktop sharing.
    desktopSharingFirefoxExtensionURL: null,

    // Disables ICE/UDP by filtering out local and remote UDP candidates in signalling.
    webrtcIceUdpDisable: false,
    // Disables ICE/TCP by filtering out local and remote TCP candidates in signalling.
    webrtcIceTcpDisable: false,

    openSctp: true, // Toggle to enable/disable SCTP channels
    disableStats: false,
    disableAudioLevels: false,
    channelLastN: -1, // The default value of the channel attribute last-n.
    adaptiveLastN: false,
    //disableAdaptiveSimulcast: false,
    enableRecording: false,
    enableWelcomePage: true,
    disableSimulcast: false,
    logStats: false, // Enable logging of PeerConnection stats via the focus
//    requireDisplayName: true, // Forces the participants that doesn't have display name to enter it when they enter the room.
//    startAudioMuted: 10, // every participant after the Nth will start audio muted
//    startVideoMuted: 10, // every participant after the Nth will start video muted
//    defaultLanguage: "en",
// To enable sending statistics to callstats.io you should provide Applicaiton ID and Secret.
//    callStatsID: "", // Application ID for callstats.io API
//    callStatsSecret: "", // Secret for callstats.io API
    /*noticeMessage: 'Service update is scheduled for 16th March 2015. ' +
    'During that time service will not be available. ' +
    'Apologise for inconvenience.',*/
    disableThirdPartyRequests: false,
    minHDHeight: 540
};
```

## 7. Install dependencies 

```
sudo chown -R $(whoami) /srv/ec2-52-51-12-4.eu-west-1.compute.amazonaws.com
cd /srv/ec2-52-51-12-4.eu-west-1.compute.amazonaws.com
sudo apt-get install nodejs
sudo apt-get install npm
sudo ln -s /usr/bin/nodejs /usr/bin/node
sudo npm -g install npm@next
sudo npm install
sudo make
```

## 8. Restart services

```
sudo invoke-rc.d nginx restart
sudo prosodyctl restart
```

## 9. Reboot system and check services availability
```
sudo reboot
```
