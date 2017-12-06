/**
 * @fileoverview QIOT MQTT client API
 * @author fgalindo@quantumiot.com (Felix Galindo)
 */

var util = require('util');
var EventEmitter = require('events').EventEmitter;
var https = require("https");

function Client(config) {
    console.log("Starting QIOT HTTPS Client");
    var Client = this;
    Client.config = config;
    Client.httpsConfig = {
        hostname: 'api.qiot.io',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'QIOT ' + config.accountToken
        }
    }
    Client.https = https;
}

util.inherits(Client, EventEmitter);

Client.prototype.publishMessage = function(thingToken, valuesObject) {
    var Client = this;
    var message = {};
    message.messages = [];
    message.messages[0] = {};
    for (var attrname in valuesObject) {
        message.messages[0][attrname] = valuesObject[attrname];
    }
    var messageString = JSON.stringify(message);
    Client.httpsConfig.path = '/1/l/' + thingToken;
    console.log("QIOT HTTPS Client Publishing Message:", messageString, " with https config", Client.httpsConfig);
    var req = https.request(Client.httpsConfig, function(res) {
        console.log('Status: ' + res.statusCode);
        console.log('Headers: ' + JSON.stringify(res.headers));
        res.setEncoding('utf8');
        res.on('data', function(body) {
            console.log('Body: ' + body);
        });
    });
    req.on('error', function(e) {
        console.log('problem with request: ' + e.message);
    });
    req.write(messageString);
    req.end();
};

Client.prototype.registerThing = function(label, type, value, callback) {
    var Client = this;
    var message = {
        "label": label,
        "identity": [{
            "type": type,
            "value": value
        }]
    };
    var messageString = JSON.stringify(message);
    Client.httpsConfig.path = '/1/r';
    console.log("QIOT HTTPS Client Registering Thing:", messageString, " with https config", Client.httpsConfig);
    var req = https.request(Client.httpsConfig, function(res) {
        console.log('Status: ' + res.statusCode);
        console.log('Headers: ' + JSON.stringify(res.headers));
        res.setEncoding('utf8');
        res.on('data', function(body) {
            console.log('Body: ' + body);
            try {
                var data = JSON.parse(body);
                if (data.status == "success") {
                    callback(null, data.thing.thing_token)
                } else {
                    callback("Failed to register", null);
                }
            } catch (error) {
                console.log(error);
                callback("JSON parse error", null);
            }
        });
    });
    req.on('error', function(e) {
        console.log('problem with request: ' + e.message);
        callback(e.message, null);
    });
    req.write(messageString);
    req.end();
};


module.exports = function(config) {
    var instance = new Client(config);
    return instance;
};