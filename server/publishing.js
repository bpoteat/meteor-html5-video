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

Meteor.publish('user', function (_id) {
    return Meteor.users.find({_id: _id},
        {
            fields: { username: 1, _id: 1 }
        });
});

Meteor.publish('users', function () {
    return Meteor.users.find();
});

Meteor.publish('videos', function () {
    return UserVideos.find();
});

Meteor.publish('video', function (userId) {
    return UserVideos.findOne({ userId: userId });
});


Meteor.publish('audios', function () {
    return UserAudios.find();
});

Meteor.publish('audio', function (userId) {
    return UserAudios.findOne({ userId: userId });
});


Meteor.startup(function () {

});