const https = require('https');
const http = require('http');
const URL = require('url');
const Qs = require('querystring');
const MAX_REDIRECTS = 5;


const sendRequest = (url, method = 'GET', body = null, headers = {}, redirects = 0) => {
    return new Promise((resolve, reject) => {
        let urlParts = URL.parse(url);

        let sender = url.startsWith('https://') ? https : http;

        headers.Host = urlParts.hostname;

        let options = {
            hostname: urlParts.hostname,
            port: urlParts.port || (url.startsWith('https://') ? 443 : 80),
            path: urlParts.path,
            method,
            agent: new https.Agent({keepAlive: false, maxSockets: 1}),
            headers
        };

        console.log('port = ', options.port);
        console.log('Sending request to:', method, url);

        const req = sender.request(options, (res) => {
            let responseBody = '';
            console.log('Response Status:', res.statusCode);

            res.setEncoding('utf8');
            res.on('data', (chunk) => responseBody += chunk);

            res.on('end', () => {
                if (res.statusCode === 302) {
                    console.log('Redirecting to: ', res.headers.location);
                    if (redirects >= MAX_REDIRECTS) {
                        reject(new Error('Too many redirects occurred for request'));
                    } else {
                        sendRequest(res.headers.location, 'GET', null, {}, redirects + 1)
                            .then(resolve)
                            .catch(reject);
                    }
                } else if (Math.floor(res.statusCode / 100) !== 2) {
                    let error = new Error(`${res.statusCode} - ${responseBody}`);
                    error.responseBody = responseBody;
                    error.statusCode = res.statusCode;
                    reject(error);
                } else {
                    resolve(responseBody);
                }
            });

        });


        req.on('error', reject);
        if (method !== 'GET' && body) {
            req.write(body);
        }

        req.end();
    })
};

exports.getJson = (url, headers = {}) => {
    return sendRequest(url, 'GET', null, headers)
        .then((data) => JSON.parse(data));
};


exports.postJson = (url, data = {}, headers = {}) => {
    headers = headers || {};
    headers['content-type'] = 'application/json';

    return sendRequest(url, 'POST', JSON.stringify(data), headers)
        .then((data) => JSON.parse(data));
};

exports.postForm = (url, data = {}, headers = {}) => {
    headers = headers || {};
    headers['content-type'] = 'application/x-www-form-urlencoded';

    return sendRequest(url, 'POST', Qs.stringify(data), headers);
};
