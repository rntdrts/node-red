/**
 * Copyright 2014, 2015 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

var log = require("../log");

var redNodes = require("../nodes");
var settings = require("../settings");
var mqtt = require("mqtt");
var Nodes = require("../../app/models/nodes");

var client = mqtt.connect("mqtt://192.168.160.122");

module.exports = {
    get: function(req,res) {
        Nodes.findOne({'user_id': req.user._id}, function(err, node) {
            if (err) return handleError(err);
            res.json(JSON.parse(node.nodes));
        });
    },
    post: function(req,res) {
        var flows = req.body;
        var deploymentType = req.get("Node-RED-Deployment-Type")||"full";
        log.audit({event: "flows.set",type:deploymentType},req);
        redNodes.setFlows(flows,deploymentType).then(function() {
            res.send(204);
        }).otherwise(function(err) {
            log.warn(log._("api.flows.error-save",{message:err.message}));
            log.warn(err.stack);
            res.json(500,{error:"unexpected_error", message:err.message});
        });

        Nodes.findOne({'user_id': req.user._id}, function(err, node) {
            if (!node) {
                var nodeElement = new Nodes({user_id: req.user._id, nodes: [JSON.stringify(flows)]});
                nodeElement.save(function (err) {
                    if (err) return handleError(err);
                })
            }
            node.nodes = [JSON.stringify(flows)];
            node.save(function (err) {
                if (err) return handleError(err);
            })
        });

        client.publish('MessageBroker', new Buffer(JSON.stringify({name:'test', data:flows})));
    }
}
