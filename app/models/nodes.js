var mongoose = require('mongoose');

var nodesSchema = {
    user_id     : String,
    nodes       : [String]
};

module.exports = mongoose.model('Nodes', nodesSchema);