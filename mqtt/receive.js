var mqtt = require("mqtt");

var client = mqtt.connect("mqtt://192.168.160.122");

read("Key", /.+/, function (key1) {

    key1.split(" ").forEach(function (key) {
        client.subscribe(key);
    });

    client.on('message', function(topic, message) {
        if(topic != "A3")
            client.publish("A3", message);

        console.log(" %s:'%s'", topic, message);
    });
});


/**
 * Read
 * @param      {String}   source path
 * @return     {Array} an array of string path
 */
function read(question, format, callback) {
    var stdin = process.stdin, stdout = process.stdout;

    stdin.resume();
    stdout.write(question + ": ");

    stdin.once('data', function (data) {
        data = data.toString().trim();

        if (format.test(data)) {
            callback(data);
        } else {
            stdout.write("It should match: " + format + "\n");
            read(question, format, callback);
        }
    });
}