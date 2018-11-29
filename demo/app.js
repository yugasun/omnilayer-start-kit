import bitcoin from 'bitcoinjs-lib';
import Network from './network';

// here must be a object quote to dismiss inconsistent network error in txb.sign
const nw = Network.regtest;
const rpcConfig = {
    username: 'admin',
    password: '123456',
    hostname: '127.0.0.1',
    port: '8080',
};

class App {
    constructor(network) {
        this.network = network;
    }

    genAddress() {
        const keyPair = bitcoin.ECPair.makeRandom({
            network: this.network,
        });
        const wif = keyPair.toWIF();
        console.log('wif', wif);

        const { address } = bitcoin.payments.p2pkh({
            pubkey: keyPair.publicKey,
            network: this.network,
        });
        console.log('address', address);
    }

    async transfer() {
        const alice = bitcoin.ECPair.fromWIF('<wif generate by genAddress>');

        const txb = new bitcoin.TransactionBuilder();

        const simple_send = [
            '6f6d6e69', // omni
            '0000', // version
            '00000000001f', // 31 for Tether
            '000000003B9ACA00', // amount = 10 * 100 000 000 in HEX
        ].join('');
        const data = [Buffer.from(simple_send, 'hex')];
        const omniOutput = bitcoin.payments.embed({ data }).output;
        const totalUnspent = 1000000;
        const dustValue = 546;
        txb.addInput('<txhash>', totalUnspent); // Alice's previous transaction output, has 15000 satoshis
        txb.addOutput('<receiver address>', dustValue);
        txb.addOutput(omniOutput, 0);
        txb.addOutput('<sender address>', totalUnspent - dustValue);

        txb.sign(0, alice);

        const txhash = txb.build().toHex();
        console.log('Tx hash: ', txhash);

        const result = await this.broadcast(txhash);
        console.log('Broadcast result: ', result);
    }

    async broadcast(...args) {
        try {
            const rpcClient = new Rpc({
                protocol: 'http',
                user: rpcConfig.username,
                pass: rpcConfig.password,
                host: rpcConfig.hostname,
                port: rpcConfig.port,
            });
            rpcClient.sendRawTransaction(args, (err, ret) =>
                ret ? Promise.resolve(ret) : Promise.reject(err),
            );
        } catch (e) {
            Promise.reject(e);
        }
    }
}

const app = new App(nw);
app.genAddress();
app.transfer();
