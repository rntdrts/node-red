var src = process.cwd() + '/app/';
var Peer = require(src + 'models/peer');

module.exports = function (app, passport) {

// normal routes ===============================================================

    // show the home page (will also have our login links)
    app.get('/', function (req, res) {
        res.render('index');
    });

    // PROFILE SECTION =========================
    app.get('/profile', isLoggedIn, function (req, res) {
        res.render('profile', {
            user: req.user
        });
    });

    app.get('/home', isLoggedIn, function (req, res) {
        res.render('home', {
            user: req.user
        });
    });

    // Peers

    app.get('/peer', isLoggedIn, function (req, res) {
        Peer.find(function (err, peers) {
            if (!err) {
                res.render('peers/index', {user: req.user, Peers: peers});
            } else {
                res.statusCode = 500;

                return res.json({
                    error: 'Server error'
                });
            }
        });
    });

    app.get('/peer/new', isLoggedIn, function (req, res) {
        res.render('peers/new',{
            user: req.user
        });
    });

    app.post('/peer/create', isLoggedIn, function (req, res) {
        console.log(req.query);
        console.log(req.body);

        var paramObj = {
            name: req.body['name'],
            description: req.body['description'],
            ip: req.body['ip']
        };

        Peer.create(paramObj, function PeerCreated(err, peer) {
            if (err) {
                console.log(err);
                return res.redirect('/peer/new');
            }
            res.redirect('/peer/show?id=' + peer.id);

        });
    });

    app.get('/peer/show', isLoggedIn, function (req, res) {
        console.log(req.query);
        console.log(req.body);

        Peer.findOne(req.query['id'], function (err, peer) {
            if (err) return next(err);
            if (!peer) return next();

            res.render('peers/show',{
                Peer: peer
            });
        });
    });

    app.get('/peer/edit', isLoggedIn, function (req, res) {
        Peer.findOne(req.query['id'], function (err, peer) {
            if (err) return next(err);
            if (!peer) return next('Peer doesn\'t exist.');

            res.render('peers/edit',{
                Peer: peer
            });
        });
    });

    app.post('/peer/update', isLoggedIn, function (req, res) {

        var paramObj = {
            name: req.body['name'],
            description: req.body['description'],
            ip: req.body['ip']
        };

        Peer.update(req.query['id'], paramObj, function (err) {
            if (err) {
                console.log(err);
                return res.redirect('/peer/edit?id=' + req.query['id']);
            }
            res.redirect('/peer/show?id=' + req.query['id']);
        });
    });

    app.post('/peer/destroy', isLoggedIn, function (req, res) {
        Peer.findOne(req.body['id'], function (err, peer) {
            if (err) return next(err);

            if (!peer) return next('Peer doesn\'t exist.');

            console.log(req.body['id']);
            Peer.destroy(req.body['id'], function (err) {

                if (err) return next(err);
            });
            res.redirect('/peer');
        });
    });

    // Peers

    // LOGOUT ==============================
    app.get('/logout', function (req, res) {
        req.logout();
        res.redirect('/');
    });

// =============================================================================
// AUTHENTICATE (FIRST LOGIN) ==================================================
// =============================================================================

    // locally --------------------------------
    // LOGIN ===============================
    // show the login form
    app.get('/login', function (req, res) {
        //res.render('login', {message: req.flash('loginMessage')});
        res.render('login');
    });

    // process the login form
    app.post('/login', passport.authenticate('local-login', {
        successRedirect: '/home', // redirect to the secure profile section
        failureRedirect: '/login', // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    }));

    // SIGNUP =================================
    // show the signup form
    app.get('/signup', function (req, res) {
        //res.render('signup', {message: req.flash('loginMessage')});
        res.render('signup');
    });

    // process the signup form
    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect: '/home', // redirect to the secure profile section
        failureRedirect: '/signup', // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    }));

    // facebook -------------------------------

    // send to facebook to do the authentication
    app.get('/auth/facebook', passport.authenticate('facebook', {scope: 'email'}));

    // handle the callback after facebook has authenticated the user
    app.get('/auth/facebook/callback',
        passport.authenticate('facebook', {
            successRedirect: '/home',
            failureRedirect: '/'
        }));

    // twitter --------------------------------

    // send to twitter to do the authentication
    app.get('/auth/twitter', passport.authenticate('twitter', {scope: 'email'}));

    // handle the callback after twitter has authenticated the user
    app.get('/auth/twitter/callback',
        passport.authenticate('twitter', {
            successRedirect: '/home',
            failureRedirect: '/'
        }));


    // google ---------------------------------

    // send to google to do the authentication
    app.get('/auth/google', passport.authenticate('google', {scope: ['profile', 'email']}));

    // the callback after google has authenticated the user
    app.get('/auth/google/callback',
        passport.authenticate('google', {
            successRedirect: '/home',
            failureRedirect: '/'
        }));

// =============================================================================
// AUTHORIZE (ALREADY LOGGED IN / CONNECTING OTHER SOCIAL ACCOUNT) =============
// =============================================================================

    // locally --------------------------------
    app.get('/connect/local', function (req, res) {
        res.render('connect-local');
        //res.render('connect-local', {message: req.flash('loginMessage')});
    });
    app.post('/connect/local', passport.authenticate('local-signup', {
        successRedirect: '/home', // redirect to the secure profile section
        failureRedirect: '/connect/local', // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    }));

    // facebook -------------------------------

    // send to facebook to do the authentication
    app.get('/connect/facebook', passport.authorize('facebook', {scope: 'email'}));

    // handle the callback after facebook has authorized the user
    app.get('/connect/facebook/callback',
        passport.authorize('facebook', {
            successRedirect: '/home',
            failureRedirect: '/'
        }));

    // twitter --------------------------------

    // send to twitter to do the authentication
    app.get('/connect/twitter', passport.authorize('twitter', {scope: 'email'}));

    // handle the callback after twitter has authorized the user
    app.get('/connect/twitter/callback',
        passport.authorize('twitter', {
            successRedirect: '/home',
            failureRedirect: '/'
        }));


    // google ---------------------------------

    // send to google to do the authentication
    app.get('/connect/google', passport.authorize('google', {scope: ['profile', 'email']}));

    // the callback after google has authorized the user
    app.get('/connect/google/callback',
        passport.authorize('google', {
            successRedirect: '/home',
            failureRedirect: '/'
        }));

// =============================================================================
// UNLINK ACCOUNTS =============================================================
// =============================================================================
// used to unlink accounts. for social accounts, just remove the token
// for local account, remove email and password
// user account will stay active in case they want to reconnect in the future

    // local -----------------------------------
    app.get('/unlink/local', function (req, res) {
        var user = req.user;
        user.local.username = undefined;
        user.local.password = undefined;
        user.save(function (err) {
            res.redirect('/home');
        });
    });

    // facebook -------------------------------
    app.get('/unlink/facebook', function (req, res) {
        var user = req.user;
        user.facebook.id = undefined;
        user.facebook.token = undefined;
        user.facebook.email = undefined;
        user.facebook.name = undefined;
        user.save(function (err) {
            res.redirect('/home');
        });
    });

    // twitter --------------------------------
    app.get('/unlink/twitter', function (req, res) {
        var user = req.user;
        user.twitter.id = undefined;
        user.twitter.token = undefined;
        user.twitter.displayName = undefined;
        user.twitter.username = undefined;
        user.save(function (err) {
            res.redirect('/home');
        });
    });

    // google ---------------------------------
    app.get('/unlink/google', function (req, res) {
        var user = req.user;
        user.google.id = undefined;
        user.google.token = undefined;
        user.google.email = undefined;
        user.google.name = undefined;
        user.save(function (err) {
            res.redirect('/home');
        });
    });
};

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();

    res.redirect('/');
}