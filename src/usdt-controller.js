import fs from 'fs';
import path from 'path';
import bitcoin from 'bitcoinjs-lib';
import request from 'request-promise-native';
import varuint from 'varuint-bitcoin';
import { logger } from './utils';

export default class UsdtControler {
    /**
     * constructor
     *
     * @param {string} address handle sender address
     * @param {string} wif sender wif
     * @param {object} bitcoin network
     * @param {string} request api
     */
    constructor(
        address,
        wif,
        network,
        feeRate = 4,
        API = 'https://insight.bitpay.com/api',
    ) {
        this.API = API;
        this.network = network;
        this.address = address;
        this.wif = wif;
        this.feeRate = feeRate;
        this.dustValue = 546; // official proposal
        this.precision = 1e8;
    }

    /**
     * fetch address unspentLists
     *
     * @param {string} address address
     * @return {object[]} unspentList list array
     * [ { address: '13QmXjB1hQUu4yt7QiSDjDs2NiyET154H1',
        txid: '',
        vout: 0,
        scriptPubKey: '',
        amount: 0,
        satoshis: 0,
        height: 0,
        confirmations: 0 } ]
     */
    async fetchUnspentList(address) {
        try {
            const res = await request(`${this.API}/addr/${address}/utxo/`).then(
                JSON.parse,
            );
            return res;
        } catch (e) {
            logger.fail('error', e.message);
        }
    }

    /**
     * generate OmniLayer payload
     *
     * @param {number} amount transfer amount
     * @return {string} OmniLayer payload for tx output
     */
    genOmniPayload(amount) {
        const hexAmount = (amount * this.precision)
            .toString(16)
            .padStart(16, '0')
            .toUpperCase();
        const simpleSend = [
            '6f6d6e69', // omni
            // 31 for Tether, you can modify it depends on your regtest chain
            '000000000000001f',
            hexAmount,
        ].join('');
        const data = [Buffer.from(simpleSend, 'hex')];
        const omniOutput = bitcoin.payments.embed({ data }).output;
        return omniOutput;
    }

    /**
     * calculate tx fee
     *
     * @param {object} txb bitcoin tx building
     * @return {number} fee value
     */
    calculateTxFee(txb) {
        const redeem = Buffer.from(this.wif, 'hex');
        // calc scriptSig length. scriptSig = OP_0 + m*<sig> + OP_PUSHDATA1 + len(redeem) + redeem
        // Signatures are either 73, 72, or 71 bytes long
        let totalScriptSigSize = 0;
        totalScriptSigSize +=
            1 +
            1 * 73 +
            1 +
            varuint.encodingLength(redeem.length) +
            redeem.length;
        const fakeTxb = new bitcoin.TransactionBuilder.fromTransaction(
            txb.buildIncomplete().clone(),
            this.network,
        );
        fakeTxb.addOutput(this.address, 0);
        const fakeTx = fakeTxb.buildIncomplete();
        const txSize =
            fakeTx.byteLength() +
            varuint.encodingLength(totalScriptSigSize) +
            totalScriptSigSize;
        const feeValue = Math.ceil(this.feeRate * txSize * 1);

        return feeValue;
    }

    /**
     * transfer
     *
     * @param {number} type tx type: 1-usdt, 2-btc
     * @param {string} toAddress to address
     * @param {number} toAmount to amount
     * @param {boolean} btcTx whether is btc tx
     * @return {string} raw tx bytes
     */
    async transfer(toAddress, toAmount, btcTx = false) {
        try {
            // get key pair from wif
            const keyPair = bitcoin.ECPair.fromWIF(this.wif);

            const txb = new bitcoin.TransactionBuilder();

            const unspentList = await this.fetchUnspentList(this.address);

            // calculate total unspentList
            const totalUnspent = unspentList.reduce(
                (a, b) => a + b.satoshis,
                0,
            );

            // add tx input
            unspentList.forEach(({ txid, vout }) => txb.addInput(txid, vout));

            let changeValue = 0;
            if (btcTx) {
                const amount = toAmount * this.precision;
                txb.addOutput(toAddress, amount);
                // calculate fee value
                const feeValue = this.calculateTxFee(txb);
                changeValue = totalUnspent - feeValue - amount;
            } else {
                txb.addOutput(toAddress, this.dustValue);

                // add OmniLayer payload output
                const omniPayload = this.genOmniPayload(toAmount);
                txb.addOutput(omniPayload, 0);

                // calculate fee value
                const feeValue = this.calculateTxFee(txb);
                changeValue = totalUnspent - feeValue - this.dustValue;
            }

            // 9. check btc amount greater than dust + fee
            if (changeValue < 0) {
                logger.fail('error', 'Total unspent is not enough!');
                return false;
            }

            txb.addOutput(this.address, changeValue);

            // sign for every unspent tx
            unspentList.forEach((unspent, index) => {
                txb.sign(index, keyPair);
            });

            const txhash = txb.build().toHex();
            return txhash;
        } catch (e) {
            logger.fail('error', e.message);
        }
    }

    /**
     * broadcast transaction
     *
     * @param {string} txRaw raw tx bytes
     * @return {string} tx id
     */
    async broadcast(txRaw) {
        try {
            const res = request.post(`${this.API}/tx/send`, {
                json: true,
                body: {
                    rawtx: txRaw,
                },
            });
            return res;
        } catch (e) {
            logger.fail('error', e.message);
        }
    }

    /**
     * generate new address
     */
    static async genAddress(logPath) {
        const keyPair = bitcoin.ECPair.makeRandom({
            network: this.network,
        });
        const wif = keyPair.toWIF();
        const { address } = bitcoin.payments.p2pkh({
            pubkey: keyPair.publicKey,
            network: this.network,
        });

        const fsPromise = fs.promises;
        const addressLogPath = path.join(logPath, `.env-${address}`);

        try {
            await fsPromise.appendFile(
                addressLogPath,
                `ADDRESS=${address}\nWIF=${wif}\n`,
                {
                    encoding: 'utf8',
                    mode: 0o666,
                    flag: 'a',
                },
            );
            return {
                address,
                wif,
            };
        } catch (e) {
            logger.fail('fs error: ', e.message);
            return e;
        }
    }
}
