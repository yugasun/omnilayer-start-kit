import fs from 'fs';
import path from 'path';
import { expect } from 'chai';
import UsdtController from '../src/usdt-controller';
import { getConfig } from '../src/utils';
import Network from '../src/network';

// here must be a object quote to dismiss inconsistent network error in txb.sign
const nw = Network.bitcoin;

describe('Unit test for src/usdt-controller.js', async function() {
    this.timeout(5000);

    let UsdtCtrl = null;
    const testAddr = '12KrCn2HfELH3BynRY2rf6Mh4ixucKTssg';
    const receiveAddress = '3EUw8vNG98SHTRhTKnixZJLe5JKfgA3X3m';

    before(async () => {
        // auto create test .env file
        const fsPromise = fs.promises;
        const addressLogPath = path.join(__dirname, `logs/.env-${testAddr}`);
        await fsPromise.appendFile(
            addressLogPath,
            `ADDRESS=${testAddr}\nWIF=L39K5yodswpExjMnNjzbwg5UHUT3z4jBULu52x2FDSrpRzxZ7xjG\n`,
        );
        const logPath = path.join(__dirname, 'logs');
        const config = getConfig(testAddr, logPath);
        UsdtCtrl = new UsdtController(
            '13QmXjB1hQUu4yt7QiSDjDs2NiyET154H1',
            config.WIF,
            nw,
        );
    });

    describe('USDT Controller', () => {
        it('Should be USDT Controller Instance', () => {
            expect(UsdtCtrl instanceof UsdtController).to.equal(true);
            expect(UsdtCtrl.fetchUnspentList).to.be.a('function');
            expect(UsdtCtrl.transfer).to.be.a('function');
            expect(UsdtCtrl.broadcast).to.be.a('function');
        });
    });

    describe('Generate address', () => {
        it('Should generate new address with wif and store it in .env-<address> file', async () => {
            const logPath = path.join(__dirname, 'logs');
            const res = await UsdtController.genAddress(logPath);

            expect(res).to.be.a('object');
            expect(res).to.have.property('address');
            expect(res).to.have.property('wif');
            const configFile = getConfig(res.address, logPath);
            expect(res.address).to.equal(configFile.ADDRESS);
            expect(res.wif).to.equal(configFile.WIF);
        });
    });

    describe('Fetch Unspent List', () => {
        it('Should return unspent array list', async () => {
            const res = await UsdtCtrl.fetchUnspentList(testAddr);
            expect(res).to.be.a('array');
        });
    });

    describe('Create usdt transaction', () => {
        it('Should return raw tx', async () => {
            const rawTx = await UsdtCtrl.transfer(receiveAddress, 1);
            expect(rawTx).to.be.a('string');
        });
    });

    describe('Create btc transaction', () => {
        it('Should return raw tx', async () => {
            const rawTx = await UsdtCtrl.transfer(receiveAddress, 0.0001, true);
            expect(rawTx).to.be.a('string');
        });
    });
});
