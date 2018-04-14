var mongo = require('mongodb').MongoClient;
var http = require('http');
var fs = require('fs');
var path = require('path');
var mime = require('mime'); // odczytuje format plikow

var debugLog = true; // turning on logging to console

mongo.connect("mongodb://localhost:27018", function (err, conn) {
    if(err){
        console.log("Connect failed" + err);
        return;
    }

    var db = conn.db("socialApp");
    var accounts = db.collection("users");

    function serverFile(rep, fileName, errorCode, message) {

        if(debugLog) console.log('Serving file ' + fileName + (message ? ' with message \'' + message + '\'': ''));

        fs.readFile(fileName, function (err, data) {
            if(err){
                serverError(rep, 404, 'Document ' + fileName + 'not found');
            }else{
                rep.writeHead(errorCode, message, { 'Content-Type': mime.getType(path.basename(fileName)) });
                if(message){
                    data = data.toString().replace('{errMsg}', rep.statusMessage.replace('{errCode}',rep.statusCode));
                }
                rep.end(data);
            }
        });
    }

    function serverError(rep,error,message) {
        serverFile(rep,'html/error.html',error,message);
    }

    var listeningPort = 8888;
    http.createServer().on('request',function (req,rep) {

        if(debugLog) console.log('HTTP request URL' + req.url);


        switch (req.url){
            case '/':
                serverFile(rep, 'html/index.html',200, '');
                break;
            default:
                if(/^\/(html|css|js|fonts|img)\//.test(req.url)) {
                    var fileName = path.normalize('./' + req.url);
                    serverFile(rep,fileName,200,'');
                }else {
                    serverError(rep,403,'Access denied');
                }
        }


    }).listen(listeningPort);

});