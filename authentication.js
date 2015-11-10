var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;
var TwitterStrategy = require('passport-twitter').Strategy;
var GithubStrategy = require('passport-github').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var User = require('./user.js');
var config = require('./oauth.js');

// config
module.exports = passport.use(new FacebookStrategy({
		clientID: config.facebook.clientID,
		clientSecret: config.facebook.clientSecret,
		callbackURL: config.facebook.callbackURL
	},
	function (accessToken, refreshToken, profile, done) {
		createOrUpdateUser(profile, done);
	}
));

passport.use(new TwitterStrategy({
		consumerKey: config.twitter.consumerKey,
		consumerSecret: config.twitter.consumerSecret,
		callbackURL: config.twitter.callbackURL
	},
	function (accessToken, refreshToken, profile, done) {
		createOrUpdateUser(profile, done);
	}
));

passport.use(new GithubStrategy({
		clientID: config.github.clientID,
		clientSecret: config.github.clientSecret,
		callbackURL: config.github.callbackURL
	},
	function (accessToken, refreshToken, profile, done) {
		createOrUpdateUser(profile, done);
	}
));

passport.use(new GoogleStrategy({
		clientID: config.google.clientID,
		clientSecret: config.google.clientSecret,
		callbackURL: config.google.callbackURL
	},
	function (accessToken, refreshToken, profile, done) {
		createOrUpdateUser(profile, done);
	}
));

function createOrUpdateUser(profile, done) {
	User.findOne({ oauthID: profile.id }, function(err, user) {
		if(err) { console.log(err); }
		if (!err && user != null) {
		 	done(null, user);
		} else {
			var user = new User({
				oauthID: profile.id,
				name: profile.displayName,
				created: Date.now()
			});
			user.save(function(err) {
				if(err) { 
					console.log(err); 
				} else {
					console.log("saving user ...");
					done(null, user);
				};
			});
		};
	});
}