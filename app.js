var appid = "e2896b2a-d466-4f82-881f-c4ca08a83123"; // <-- your app ID here
var username = "";
var groupId = "AstriCon";
var friendId = "";
var group = null;
var call = null;
var client;

/**
 * Respoke app
 */

function myRespokeApp() {

    // create Respoke client object
    client = respoke.createClient({
        appId: appid,
        developmentMode: true
    });

   
    // connect to Respoke on connect button click
    $("#controls").on("click", "#connectButton", function() {
        username = $('#username').val();
        ui.showConnectingStatus();

        client.connect({
            endpointId: username,
            onError: onError
        });

    });

    // listen for the 'connect' event 
    client.listen('connect', function(evt) {
        console.log('connect evt:', evt);
        ui.showConnectingStatus();

        //join a group once connected
        console.log('joining a group now...');
        client.join({
            id: groupId,
            onSuccess: onClientJoinSuccess,
            onError: onError,
            onJoin: onJoin,
            onLeave: onLeave
        });
    });

    // client.join helper functions [onClientJoinSuccess, onError, onJoin, onLeave]
    function onClientJoinSuccess(newGroup) {
        console.log('join success evt:', newGroup);
        console.log(username, 'joined', newGroup.id);
        group = newGroup; // store group object globally

        // populate contacts drop-down
        group.getMembers({
            onSuccess: function(members) {
                members.forEach(function(member) {
                    if (member.endpointId !== username) {
                        ui.addMenu(member.endpointId);
                    }
                });
            }
        });
        ui.showJoinedState();
    }

    function onError(e) {
        console.log('error', e);
    }

    function onJoin(evt) {
        console.log('onJoin evt:', evt);
        if (!group) {
            group = evt.target; // store group object globally if not already there
        }
        var endpointId = evt.connection.endpointId;
        console.log(endpointId, 'joined', group.id);
        ui.showJoinAlert(endpointId);
    }

    function onLeave(evt) {
        console.log('onLeave evt:', evt);
        var endpointId = evt.connection.endpointId;
        console.log(endpointId, 'left', group.id);
        ui.showLeaveAlert(endpointId);
    }

    // call friendID when call button is clicked
    $("#controls").on("click", "#callButton", function() {
        friendId = $('#friendList').val();
        console.log('calling', friendId);

        client.startCall({
           endpointId: friendId,
           onConnect: onConnect,
           onLocalMedia: onLocalVideo
        });
    });

    // listen for the 'call' event
    client.listen('call', function(evt) {
        call = evt.call; // strore call object globally
        friendId = evt.endpoint.id;
        evt.call.answer({
            onConnect: onConnect,
            onLocalMedia: onLocalVideo
        });
        // listen for the 'hangup' event for this call
        evt.call.listen('hangup', hangup);
    });

    // startCall / answer helper fucntions [onConnect, onLocalVideo]
    function onConnect(evt) {
        ui.setVideo('remoteVideoSource', evt.element);
        ui.tweet();
    }

    function onLocalVideo(evt) {
        ui.setVideo('localVideoSource', evt.element);
    }

    // hangup call on hangup button click
    $("#controls").on("click", "#hangupButton", hangup);

    function hangup(evt) {
        console.log('hangup evt:', evt);
        call.hangup();
        call = null;
        ui.resetVideo();
    }
}

/**
 * All UI changes are handled here.
 */
var ui = {

    init: function() {
        $('#status')
            .html("Not connected")
            .addClass("red");
        var controlsHTML = [
            '<input placeholder="Twitter Handle" id="username" type="text" autofocus />',
            '<button id="connectButton">Connect</button>',
            '<div id="alert">Enter your Twitter Handle for endpoint ID</div>'
        ];
        $("#controls")
            .empty()
            .html(controlsHTML.join(''));
        $("#alert")
            .addClass("green")
            .fadeIn(2000);
    },

    showConnectingStatus: function() {
        $("#status")
            .html("Connecting...")
            .addClass("yellow");
    },

    showConnectedState: function() {
        var statusHTML = [
            "Connected to Respoke as ",
            "<strong>" + username + "</strong>"
        ];
        var connectedHTML = [
            '<input placeholder="Team Name" id="groupId" type="text" autofocus />',
            '<button id="joinButton" class="joinButton">Join</button>',
            '<div id="alert">Enter your team name for group ID</div>'
        ];

        $("#status")
            .empty()
            .html(statusHTML.join(''))
            .addClass("green");
        $("#controls")
            .empty()
            .html(connectedHTML.join(''));
        $("#groupId").get(0).focus();
        $("#alert")
            .addClass("green")
            .fadeIn(2000);
    },

    showJoinedState: function() {
        var statusHTML = [
            "Connected to Respoke as ",
            "<strong>" + username + "</strong>",
            " in ",
            "<strong>" + groupId + "</strong>",
            " group"
        ];
        
        var controlsHTML = [
            '<select id="friendList">',
            '  <option value="" disabled="disabled" selected="selected">Select a name to call</option>',
            '</select>',
            '<button id="callButton">Call</button>',
            '<button id="hangupButton">Hang Up</button>',
            '<span id="alert">stuff here</span>'
        ];
        $("#status")
            .empty()
            .html(statusHTML.join(''))
            .addClass("green");
        $("#controls")
            .empty()
            .html(controlsHTML.join(''));
    },

    tweet: function () {
        username = (username.indexOf("@") === -1)?"@"+username:username;
        friendId = (friendId.indexOf("@") === -1)?"@"+friendId:friendId;
        var tweetText = username + " was in a video call with " + friendId + " using @respoke";
        var html = '<a href="https://twitter.com/intent/tweet?button_hashtag=AstriCon&text='+ tweetText + '"class="twitter-hashtag-button" data-related="billychia">Tweet #AstriCon</a>';
        var script = "<script>!function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0],p=/^http:/.test(d.location)?'http':'https';if(!d.getElementById(id)){js=d.createElement(s);js.id=id;js.src=p+'://platform.twitter.com/widgets.js';fjs.parentNode.insertBefore(js,fjs);}}(document, 'script', 'twitter-wjs');</script>";
        $("#controls").append(html).append(script);
    },

    showJoinAlert: function(endpointId) {
        $("#alert")
            .text(endpointId + " joined " + groupId)
            .removeClass("red")
            .addClass("green")
            .fadeIn(2000)
            .fadeOut(2000);
        $('#friendList').append(
            $('<option>', {
                value: endpointId,
                text: endpointId,
                id: endpointId
            })
        );
    },

    addMenu: function(endpointId) {
        $('#friendList').each(function(i) {
            if (i !== endpointId) {
                $('#friendList').append(
                    $('<option>', {
                        value: endpointId,
                        text: endpointId,
                        id: endpointId
                    })
                );
            }
        });
    },

    showLeaveAlert: function(endpointId) {
        $("#alert")
            .text(endpointId + " left " + groupId)
            .removeClass("green")
            .addClass("red")
            .fadeIn(2000)
            .fadeOut(2000);
        $('#' + endpointId).remove();
    },

    setVideo: function(elementId, videoElement) {
        $("#" + elementId)
            .html(videoElement)
            .children('video')
            .addClass(elementId);
    },

    resetVideo: function() {
        $("#remoteVideoSource").empty();
        $("#localVideoSource").empty();
    }

};


// Initialize

ui.init();
myRespokeApp();

