/**
 * Created by ricardomendes on 20/11/15.
 */
var mongoose = require('mongoose');

// define the schema for our peer model
var peerSchema = mongoose.Schema({
        name        : String,
        description : String,
        ip          : String
});

// create the model for peers and expose it to our app
module.exports = mongoose.model('Peer', peerSchema);
