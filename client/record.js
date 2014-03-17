// Copyright (C) 2014 Brian Poteat
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
// DEALINGS IN THE SOFTWARE.

function supportsMedia() {
    return !!(navigator.getUserMedia || navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia || navigator.msGetUserMedia);
}

// cross-browser support for getUserMedia
navigator.getUserMedia = navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia ||
    navigator.msGetUserMedia;

window.URL = window.URL || window.webkitURL;

window.requestAnimationFrame = (function () {
    return  window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame
})();

window.AudioContext = window.AudioContext || window.webkitAudioContext;


var mediaStream;

// global variables for showing/encoding the video
var mediaInitialized = false;
var recording = false;
var videoCanvas;
var videoContext;
var frameTime;
var imageArray = [];

// global variables for recording audio
var audioContext;
var audioRecorder;

// function for requesting the media stream
function setupMedia() {
    if (supportsMedia()) {
        audioContext = new AudioContext();

        navigator.getUserMedia(
            {
                video: true,
                audio: true
            },
            function (localMediaStream) {
                // map the camera
                var video = document.getElementById('live_video');
                video.src = window.URL.createObjectURL(localMediaStream);

                // create the canvas & get a 2d context
                videoCanvas = document.createElement('canvas');
                videoContext = videoCanvas.getContext('2d');

                // setup audio recorder
                var audioInput = audioContext.createMediaStreamSource(localMediaStream);
                //audioInput.connect(audioContext.destination);
                // had to replace the above with the following to mute playback
                // (so you don't get feedback)
                var audioGain = audioContext.createGain();
                audioGain.gain.value = 0;
                audioInput.connect(audioGain);
                audioGain.connect(audioContext.destination);

                audioRecorder = new Recorder(audioInput);
                mediaStream = localMediaStream;
                mediaInitialized = true;

                document.getElementById('uploading').hidden = true;
                document.getElementById('media-error').hidden = true;
                document.getElementById('record').hidden = false;
            },
            function (e) {
                console.log('web-cam & microphone not initialized: ', e);
                document.getElementById('media-error').hidden = false;
            }
        );
    }
};

// exposed template helpers
Template.record.supportsMedia = supportsMedia;

Template.record.onLoad = function () {
    setupMedia();
};

// template event handlers
Template.record.events = {
    'click #start-recording': function (e) {
        console.log("click #start-recording");
        e.preventDefault();

        if (!Meteor.user()) {
            // must be the logged in user
            console.log("\tNO USER LOGGED IN");
            return;
        }
        document.getElementById('stop-recording').disabled = false;
        document.getElementById('start-recording').disabled = true;
        startRecording();
    },
    'click #stop-recording': function (e) {
        console.log("click #stop-recording");
        e.preventDefault();

        document.getElementById('stop-recording').disabled = true;
        document.getElementById('start-recording').disabled = false;
        stopRecording();
    }
};


function startRecording() {
    console.log("Begin Recording");

    videoElement = document.getElementById('live_video');
    videoCanvas.width = videoElement.width;
    videoCanvas.height = videoElement.height;

    imageArray = [];

    // do request frames until the user stops recording
    recording = true;
    frameTime = new Date().getTime();
    requestAnimationFrame(recordFrame);

    // begin recording audio
    audioRecorder.record();
}

function stopRecording() {
    console.log("End Recording");
    recording = false;
}

function completeRecording() {
    // stop & export the recorder audio
    audioRecorder.stop();

    var user = Meteor.user();
    if (!user) {
        // must be the logged in user
        console.log("completeRecording - NO USER LOGGED IN");
        return;
    }
    console.log("completeRecording: " + user._id);

    document.getElementById('uploading').hidden = false;

    audioRecorder.exportWAV(function (audioBlob) {
        // save to the db
        BinaryFileReader.read(audioBlob, function (err, fileInfo) {
            UserAudios.insert({
                userId: user._id,
                audio: fileInfo,
                save_date: Date.now()
            });
        });
        console.log("Audio uploaded");
    });

    // do the video encoding
    // note: tried doing this in real-time as the frames were requested but
    // the result didn't handle durations correctly.
    var whammyEncoder = new Whammy.Video();
    for (i in imageArray) {
        videoContext.putImageData(imageArray[i].image, 0, 0);
        whammyEncoder.add(videoContext, imageArray[i].duration);
        delete imageArray[i];
    }
    var videoBlob = whammyEncoder.compile();

    BinaryFileReader.read(videoBlob, function (err, fileInfo) {
        UserVideos.insert({
            userId: user._id,
            video: fileInfo,
            save_date: Date.now()
        });
    });
    console.log("Video uploaded");

    // stop the stream & redirect to show the video
    mediaStream.stop();
    Router.go('showVideo', { _id: user._id });
}

function recordFrame() {
//    console.log("-frame");

    if (recording) {
        var image;
        // draw the video to the context, then get the image data
        var video = document.getElementById('live_video');
        var width = video.width;
        var height = video.height;
        videoContext.drawImage(video, 0, 0, width, height);

        // optionally get the image, do some filtering on it, then
        // put it back to the context
        imageData = videoContext.getImageData(0, 0, width, height);
        // - do some filtering on imageData
        videoContext.putImageData(imageData, 0, 0);

        var frameDuration = new Date().getTime() - frameTime;

        console.log("duration: " + frameDuration);
        //whammyEncoder.add(videoContext, frameDuration);
        imageArray.push(
            {
                duration: frameDuration,
                image: imageData
            });
        frameTime = new Date().getTime();

        // request another frame
        requestAnimationFrame(recordFrame);
    }
    else {
        completeRecording();
    }
}


var BinaryFileReader = {
    read: function (file, callback) {
        var reader = new FileReader;

        var fileInfo = {
            name: file.name,
            type: file.type,
            size: file.size,
            file: null
        }

        reader.onload = function () {
            fileInfo.file = new Uint8Array(reader.result);
            callback(null, fileInfo);
        }
        reader.onerror = function () {
            callback(reader.error);
        }

        reader.readAsArrayBuffer(file);
    }
}
