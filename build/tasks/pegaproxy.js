var httpProxy = require('http-proxy');


module.exports = function(target, token) {
    var proxy = httpProxy.createProxyServer({
        target: target,
        changeOrigin: true
    });

    proxy.on('proxyReq', function(proxyReq, req, res, options) {
        proxyReq.setHeader('X-Auth-Token', token);
    });

    proxy.on('error', function(ex) {
        console.log(ex);
    });

    var middleware = function(req, res, next) {
        try {
            if (req && req.url && req.url.match(/\/api\/|\/assets\/|\/avatar\//)) {
                proxy.web(req, res);
            } else {
                next();
            }
        } catch (ex) {
            console.log(ex);
        }
    };

    return middleware;
};
