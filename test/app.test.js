const chai = require("chai");
const expect = chai.expect;
chai.use(require("chai-http"));
chai.use(require("chai-like"));
chai.use(require("chai-things"));
chai.use(require("chai-sorted"));
chai.use(require("chai-match"));
const AccessControlMiddleware = require("../app");
const acm = new AccessControlMiddleware("MySecret");
const jwt = require("jsonwebtoken");
let authorizationToken;
describe("AccessControlMiddleware", () => {
    before(done => {
        authorizationToken = jwt.sign({}, "MySecret", {
            expiresIn: 10080 // in seconds
        });

        done();
    })
    describe("hasRelatedToken", () => {
        it("should return false when no token is provided in request body", () => {
            expect(acm.hasRelatedToken({ body: "Foo" })).to.be.false;
        });
        it("should return true when token is provided in request body", () => {
            const relatedToken = jwt.sign({}, "MySecret", {
                expiresIn: 10080 // in seconds
            });
            expect(acm.hasRelatedToken({ relatedToken })).to.be.true;
        });

        it("should throw an exception when invoking method without argument", () => {
            expect(acm.hasRelatedToken).to.throw("Missing parameter : body")
        });
    });

    describe("checkRelated", () => {
        it("should return true when the token provided is not valid", () => {
            const relatedToken = jwt.sign({ grants: { resource: "Foo" } }, "MySecret", {
                expiresIn: 10080 // in seconds
            });
            expect(acm.checkRelated({ token: relatedToken, resource: "Bar" })).to.be.false;
        });

        it("should return false when the token provided is valid", () => {
            const relatedToken = jwt.sign({ grants: { resource: "Foo" } }, "MySecret", {
                expiresIn: 10080 // in seconds
            });
            expect(acm.checkRelated({ token: relatedToken, resource: "Foo" })).to.be.true;
        });

        it("should throw an exception when invoking method without argument", () => {
            expect(acm.checkRelated).to.throw("Missing parameters : token, resource")
        });
    });
    describe("isMultipleResources", () => {
        it("should return false when an empty context is passed", () => {
            expect(acm.isMultipleResources({})).to.be.false;
        });
        it("should return true when an context is passed", () => {
            expect(acm.isMultipleResources({ source: "params", key: "fooId" })).to.be.true;
        });
    });

    descrive("getUserAuthorizationType", () => {

    });
});