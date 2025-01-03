global.app.get('/', (req, res) => {
    res.render('index', { rawOutput: null, prettyOutput: null, error: null });
});

