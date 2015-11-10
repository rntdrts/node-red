var mqtt = require("mqtt");

var client = mqtt.connect("mqtt://192.168.160.122");

read("Key", /.+/, function (key) {
    read("Msg", /.+/, function (msg) {
        console.log("Key: ", key);
        console.log("Msg:", msg);

        //client.assertExchange(ex, 'topic', {durable: false});
        client.publish(key, new Buffer(msg));
        console.log(" Sent %s: '%s'", key, msg);

        //process.exit();
        setTimeout(function () {
            client.end();
            process.exit(0);
        }, 500);
    });
});

/**
 * @param      {String}   source path
 * @param      {Object}   options
 * @param      {Function} callback
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