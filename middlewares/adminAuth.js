const jwt = require('jsonwebtoken')

const adminAuth = async(req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            res.redirect('/adminlogin.html');
            return;
        }
        jwt.verify(token, 'deepakdeepakdeepakdeepakdeepakdeepak', (err, decodedToken) => {
            if (err || !decodedToken.admin) {
                res.redirect('/adminlogin.html');
                return;
            }
            req.user = decodedToken;
            req.token = token;


            next();
        });
    } catch (error) {
        console.log('Error in authentication', error);
        res.status(500).send('Something went wrong');
        res.redirect('/admin');
    }
};

module.exports = adminAuth