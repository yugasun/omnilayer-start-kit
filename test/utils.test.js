import path from 'path';
import fs from 'fs';
import { expect } from 'chai';
import { parseEnvByPath, getConfig, logger } from '../src/utils';

describe('Unit test for src/utils.js', function() {
    before(async () => {
        // auto create test .env file
        const fsPromise = fs.promises;
        const address = '12KrCn2HfELH3BynRY2rf6Mh4ixucKTssg';
        const addressLogPath = path.join(__dirname, `logs/.env-${address}`);

        try {
            await fsPromise.appendFile(
                addressLogPath,
                `ADDRESS=${address}\nWIF=L39K5yodswpExjMnNjzbwg5UHUT3z4jBULu52x2FDSrpRzxZ7xjG\n`,
            );
        } catch (e) {
            console.log('Error', e);
        }
    });
    describe('parseEnvByPath function', function() {
        it('Should return config object containing ADDRESS and WIF property', function() {
            const envPath = path.join(
                __dirname,
                'logs/.env-12KrCn2HfELH3BynRY2rf6Mh4ixucKTssg',
            );
            const config = parseEnvByPath(envPath);
            expect(config).to.be.a('object');
            expect(config)
                .to.have.property('ADDRESS')
                .with.lengthOf(34);
            expect(config).to.have.property('WIF');
            expect(config.WIF).to.be.a('string');
        });
    });

    describe('getConfig function', function() {
        it('Should return config object containing ADDRESS and WIF property', function() {
            const logPath = path.join(__dirname, 'logs');
            const config = getConfig(
                '12KrCn2HfELH3BynRY2rf6Mh4ixucKTssg',
                logPath,
            );
            expect(config).to.be.a('object');
            expect(config).to.have.property('ADDRESS');
            expect(config.ADDRESS).to.be.a('string');
            expect(config).to.have.property('WIF');
            expect(config.WIF).to.be.a('string');
        });
    });

    describe('logger', function() {
        it('Should contain success and fail method', function() {
            expect(logger).to.be.a('object');
            expect(logger).to.have.property('success');
            expect(logger.success).to.be.a('function');
            expect(logger).to.have.property('fail');
            expect(logger.fail).to.be.a('function');
        });
    });
});
