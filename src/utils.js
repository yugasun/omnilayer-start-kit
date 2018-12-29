import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import chalk from 'chalk';

/**
 * parse env by path
 *
 * @param {string} p env file path
 * @return {object} parsed env result
 */
function parseEnvByPath(p) {
    const config = dotenv.parse(fs.readFileSync(p));
    return config;
}

function getConfig(address, logPath) {
    const envPath = path.join(
        logPath,
        // you can modify it for anywhere placing your env config
        `.env-${address}`,
    );
    const config = parseEnvByPath(envPath);
    return config;
}

const logger = {
    /**
     * display success log
     *
     * @param {string} key log key
     * @param {string} value log value
     */
    success(key, value) {
        console.log(
            chalk.bgGreen(chalk.black(` ${key.toUpperCase()} `)),
            value,
        );
    },

    /**
     * display fail log
     *
     * @param {string} key log key
     * @param {string} value log value
     */
    fail(key, value) {
        console.log(chalk.bgRed(chalk.white(` ${key.toUpperCase()} `)), value);
    },
};

export { parseEnvByPath, getConfig, logger };
