const express = require("express");
const app = express();
const http = require("http");
const server = http.Server(app);// eslint-disable new-Cap
const bodyParser = require("body-parser");
const cors = require("cors");
const passport = require("passport");
const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
const LocalStrategy = require("passport-local");
const Common = require("../../../common");
const httpCode = require("../http_code");
const AccessControl = require("accesscontrol");
const AccessControlMiddleware = require("../../../app");


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ limit: "20mb" }));
app.use(cors());

initAuthentification();

const accessControlMiddleware = new AccessControlMiddleware({ secret: "MySecret", accessControl: getAuthorizations() });

app.get(`/bar`, [passport.authenticate("jwt", { session: false }), accessControlMiddleware.check([{
    resource: "bar",
    action: "read"
}])], (req, res) => {
    res.status(httpCode.HTTP_OK).send();
});

app.get(`/foo/:fooId`, [passport.authenticate("jwt", { session: false }), accessControlMiddleware.check([{
    resource: "foo",
    action: "read",
    context: { type: "foo", source: "params", key: `fooId` }
}])], (req, res) => {
    res.status(httpCode.HTTP_OK).end()
});

app.get(`/foo`, [passport.authenticate("jwt", { session: false }), accessControlMiddleware.check([{
    resource: "foo",
    action: "read"
}])], (req, res) => {
    let bars = [
        { id: 1 },
        { id: 2 },
        { id: 3 }
    ]
    if (req.query.filters !== undefined) { // On necessary in this test as the result is not filter by database request.
        bars = bars.filter(bar => JSON.parse(req.query.filters.id).values.includes(bar.id));
    }
    res.status(httpCode.HTTP_OK).json(bars);
});

app.get(`/baz`, [passport.authenticate("jwt", { session: false }), accessControlMiddleware.check([{
    resource: "baz",
    action: "read"
}])], (req, res) => {
    res.status(httpCode.HTTP_OK).json();
});



/** Let the user authenticate via POST method to the following url http://127.0.0.1:8080/api/login
 * Credential need to be a json object like this { email: "", password: ""}
 * @see server.js#localLogin
 * @return {user} A json object representing the user information if succeed.
*/
app.post("/login", passport.authenticate("local", { session: false }), (req, res) => {
    res.status(httpCode.HTTP_OK).json({
        token: Common.generateToken(req.user, "MySecret")
    });
});


server.listen({ port: 3000 }, () => {
    console.log(`Server start on port: 3000`);
}).on("error", err => {
    console.log(`Server failed to start`);
    console.log(err);
});

/**
 * Initialize passport authentification
 * @return {*} void
 */
function initAuthentification() {


    console.log("Setting up passport configuration");
    const localOptions = { usernameField: "email" };

    console.log("Setting up local login strategy");
    const localLogin = new LocalStrategy(localOptions, (email, password, done) => {
        done(null, {
            user: {
                id: 1,
                email: "foo.bar@baz.com",
                firstname: "foo",
                name: "bar"
            },
            resources: [
                { type: "foo", fkey: 1 }
            ]
        });
    });

    const jwtOptions = {
        // Telling Passport to check authorization headers for JWT
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        // Telling Passport where to find the secret
        secretOrKey: "MySecret"
    };

    console.log("Setting up JWT login strategy");
    const jwtLogin = new JwtStrategy(jwtOptions, (payload, done) => {
        done(null, {
            user: {
                id: 1,
                email: "foo.bar@baz.com",
                firstname: "foo",
                name: "bar"
            },
            resources: [
                { type: "foo", fkey: 1 }
            ]
        });
    });

    passport.use(jwtLogin);
    passport.use(localLogin);
    app.use(passport.initialize());

    module.exports = app;
}

function getAuthorizations() {
    const ac = new AccessControl();

    ac.grant('u-bar')
        .readAny('bar')
        .readOwn('foo');

    return ac;
}
