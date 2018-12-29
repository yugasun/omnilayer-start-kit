import path from 'path';
import { getConfig, logger } from '../src/utils';
import UsdtControler from '../src/usdt-controller';
import Network from '../src/network';

// here must be a object quote to dismiss inconsistent network error in txb.sign
const nw = Network.bitcoin;

async function main() {
    // generate a new address with wif, and store in logs
    const logPath = path.join(__dirname, '../logs')
    const addrRes = await UsdtControler.genAddress(logPath);
    logger.success('Generate address: ', JSON.stringify(addrRes));

    const receiveAddress = '3EUw8vNG98SHTRhTKnixZJLe5JKfgA3X3m';

    // get config from .env-<address> file
    const config = getConfig('1EQ6tiGycwEFsshoyrekZQEETQBt5QvqCb', logPath);
    logger.success('config', JSON.stringify(config));

    const app = new UsdtControler(config.ADDRESS, config.WIF, nw);

    const rawTx = await app.transfer(receiveAddress, 0.001, true);
    if (rawTx) {
        logger.success('raw tx', rawTx);

        // const bdRes = await app.broadcast(rawTx);
        // logger.success('broadcast result', bdRes);
    }
    const unspent = await app.fetchUnspentList(receiveAddress);
    logger.success('unspent', JSON.stringify(unspent));
}

main();
