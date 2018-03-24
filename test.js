//LND API not working 21MAR18 2209
var fs = require('fs');
var lndCert = fs.readFileSync("/home/ubuntu/.lnd/tls.cert");
var grpc = require('grpc')
var credentials = grpc.credentials.createSsl(lndCert);
var lnrpcDescriptor = grpc.load("rpc.proto");
var lnrpc = lnrpcDescriptor.lnrpc;
var lightning = new lnrpc.Lightning('localhost:10009', credentials); 

var cmd = require("node-cmd")

var pay_req = 'lnbc1500n1pdtvyuwpp5e50wd3xv2ru6tyfvryemgz0gf25679vnc8nwef9452mm33e3nq9sdpc2fjkzepqg9e8g6trd3jn5gzxwfjk2gzdv95kumn9wssyx6rpdehx2mrncqzys3ch8ulyjxhysuuj0lasekymc9cuk55ttm2w9xd4qnyugpwu77zvrmkk3fkjj75fgq8vlx78crmdpauvj2t7cpuvn0du465g3fqpdwhcqu8vfeh'

cmd.get(
       'cd ~/gocode/bin/ && ./lncli sendpayment --amt 5 --pay_req='+pay_req,
            function(err, data, stderr){
                var sp = JSON.parse(data)
                console.log('Sent Payment', sp) 

});

/*
call = lightning.addInvoice({
        memo: "adwatcher",
        value: 50,
        }, function(err, response) {

            console.log('AddInvoice: ' + response.payment_request);*/
