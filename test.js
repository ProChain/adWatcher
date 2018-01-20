
var fs = require('fs');
var lndCert = fs.readFileSync("/home/ubuntu/.lnd/tls.cert");
var grpc = require('grpc')
var credentials = grpc.credentials.createSsl(lndCert);
var lnrpcDescriptor = grpc.load("rpc.proto");
var lnrpc = lnrpcDescriptor.lnrpc;
var lightning = new lnrpc.Lightning('localhost:10009', credentials); 
call = lightning.walletBalance({ 
    witness_only: false,
  }, function(err, response) {
    console.log('WalletBalance: ' + response.total_balance);
    console.log(err)
  });

call = lightning.sendPaymentSync({ 
    payment_request: 'lntb10n1pdxxl42pp5phs2u8ad0kv8s8yfkxaffcjm9w0a8avnjmugravjwak3nrua6yfsdq0v9j8wct5vd5x2uscqzysu8xfgrkxeqekah2vzm3fq2pxf2qr59jzzc7mycd44het7th02hny3srwtxd0fganjz6shqsqjv00vj8rd7k9g9jhn9p2d4t3a9elwmsphspjeq',
  }, function(err, response) {
    console.log('SendPaymentSync: ' + JSON.stringify(response));
    console.log(err);
  })
