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
            if(node)
                res.json(JSON.parse(node.nodes));
            else
                res.json([]);
        });
    },
    post: function(req,res) {
        var flows = req.body;
        var deploymentType = req.get("Node-RED-Deployment-Type")||"full";
        log.audit({event: "flows.set",type:deploymentType},req);

        flows = getJson(flows);

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
    }
};

function getJson(flows) {
    var rules = [];
    var x1, x2, x3;
    for (var i = 0; i < flows.length; i++) {
        if (flows[i].type !== 'tab') {
            for (var z = i+1; z < flows.length; z++) {
                for (var x = flows.length - 1; x > z; x--) {
                    if (flows[i].wires.length) {
                        if (
                            flows[i].wires[0][0] === flows[z].id &&
                            flows[z].wires.length && flows[z].wires[0][0] === flows[x].id
                        ) {
                            x1 = {index: i, rule: flows[i]};
                            x2 = {index: z, rule: flows[z]};
                            x3 = {index: x, rule: flows[x]};
                        } else if (
                            flows[z].wires.length && flows[z].wires[0][0] === flows[i].id &&
                            flows[i].wires[0][0] === flows[x].id
                        ) {
                            x1 = {index: z, rule: flows[z]};
                            x2 = {index: i, rule: flows[i]};
                            x3 = {index: x, rule: flows[x]};
                        } else if (
                            flows[i].wires[0][0] === flows[x].id &&
                            flows[x].wires.length && flows[x].wires[0][0] === flows[z].id
                        ) {
                            x1 = {index: x, rule: flows[x]};
                            x2 = {index: i, rule: flows[i]};
                            x3 = {index: z, rule: flows[z]};
                        } else if (
                            flows[z].wires.length && flows[z].wires[0][0] === flows[i].id
                            && flows[i].wires[0][0] === flows[x].id
                        ) {
                            x1 = {index: z, rule: flows[z]};
                            x2 = {index: i, rule: flows[i]};
                            x3 = {index: x, rule: flows[x]};
                        }
                    } else {
                        if (
                            flows[x].wires.length && flows[x].wires[0][0] === flows[z].id &&
                            flows[z].wires.length && flows[z].wires[0][0] === flows[i].id
                        ) {
                            x1 = {index: x, rule: flows[x]};
                            x2 = {index: z, rule: flows[z]};
                            x3 = {index: i, rule: flows[i]};
                        } else if (
                            flows[z].wires.length && flows[z].wires[0][0] === flows[x].id &&
                            flows[x].wires.length && flows[x].wires[0][0] === flows[i].id
                        ) {
                            x1 = {index: z, rule: flows[z]};
                            x2 = {index: x, rule: flows[x]};
                            x3 = {index: i, rule: flows[i]};
                        }
                    }
                }
            }
            if(x1 && x2 && x3) {
                rules.push({x1: x1, x2: x2, x3: x3});
                x1 = x2 = x3 = undefined;

            }
        }
    }
    return formuleRules(rules, flows);
}

function formuleRules(rules, flows) {
    for (var i = 0; i < rules.length; i++) {
        var x1 = rules[i].x1, x2 = rules[i].x2, x3 = rules[i].x3;
        var rule3 = x3.rule.func = x1.rule.func = x2.rule.func = '';
        x1.rule.func = x2.rule.type + ' ' + x1.rule.type;
        switch(x1.rule.type) {
            case 'Temperature':
                x2.rule.func = flows[x2.index].func = 'temp : Temperature(getReadState() == true, currentTemp' +
                    setConditionRules(x2.rule);
                rule3 = x3.rule.on_or_off ? 'temp.setReadState(false); temp.setRelayON(); update(temp);' :
                    'temp.setReadState(false); temp.setRelayOff(); update(temp);';

                break;
            case 'Pir':
                x1.rule.func = "Movement detector";
                x2.rule.func = 'pir : PIRSensor( getCurrentState() == ' + (x2.rule.value ? true : false) + ')';
                rule3 = 'pir.setCurrentState(false); System.out.println("PIRSensor rule: Movement detected!");';
                break;
        }

        var d = new Date();

        if (x3.rule.sms_checkbox) {
            x3.rule.func = 'Notification.sendSMS("'+x3.rule.sms+'", "'+ d.toISOString()+'", "'+x3.rule.message+'", "'+x3.rule.id+'");';
        }
        if (x3.rule.whats_app_checkbox) {
            x3.rule.func =  x3.rule.func + 'Notification.sendWhatsApp("+351'+x3.rule.sms+'", "'+d.toISOString()+'", "'+x3.rule.message+'", "'+x3.rule.id+'");';
        }
        if (x3.rule.email_checkbox) {
            x3.rule.func = x3.rule.func + 'Notification.sendEmail("'+x3.rule.email+'", "'+d.toISOString()+'", "IESI", "'+x3.rule.message+'", "'+x3.rule.id+'");';
        }

        x3.rule.func += rule3;

        client.publish('MessageBroker', new Buffer(JSON.stringify({name: x1.rule.func, data : [x1.rule, x2.rule, x3.rule]})));
    }

    return flows;
}

function setConditionRules(rule) {
    var value = '';
    switch (rule.type) {
        case 'Max':
            value = ' > '+ rule.value + ' )';
            break;
        case 'Min':
            value = ' < '+ rule.value + ' )';
            break;
        case 'Equals':
            value = ' == '+ rule.value + ' )';
            break;
        case 'Max or equals':
            value = ' >= '+ rule.value + ' )';
            break;
        case 'Min or equals':
            value = ' <= '+ rule.value + ' )';
            break;
        default:
            break;
    }

    return value;
}