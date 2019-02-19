module.exports = (app) => {
    app.get('/health', (req, res) => {
        res.send({status: 'OK', ts: Date.now()})
    });
};
