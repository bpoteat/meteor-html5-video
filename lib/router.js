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

Router.configure({
    layoutTemplate: 'layout',
    loadingTemplate: 'loading'
});

Router.map(function () {
    this.route('home',
        {
            path: '/',
            template: 'home'
        });

    this.route('record',
        {
            path: '/record/',
            template: 'record',
            before: function()  {
                // reroute if user not logged in
                console.log("route-record.before");
                if (!Meteor.userId()) {
                    console.log("No user. Routing to home.");
                    this.redirect('home');
                }
            }
        });

    this.route('showVideo',
        {
            path: '/video/:_id',
            template: 'showVideo',
            data: function () {
                var id = this.params._id;
                console.log("route-showVideo: " + id);
                var user = Meteor.users.findOne({ _id: id });
                if (!user) {
                    console.log("! no user found for route");
                    return null;
                }

                console.log("Finding audio/video for user: " + id);
                var vid = UserVideos.findOne({ userId: id }, { sort: { save_date: -1 }});
                var aud = UserAudios.findOne({ userId: id }, { sort: { save_date: -1 }});

                return {
                    audio: aud,
                    video: vid,
                    userId: id
                }
            }
        });
});