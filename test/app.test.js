const chai = require("chai");
const expect = chai.expect;
chai.use(require("chai-http"));
chai.use(require("chai-like"));
chai.use(require("chai-things"));
chai.use(require("chai-sorted"));
chai.use(require("chai-match"));
const AccessControlMiddleware = require("../app");
const jwt = require("jsonwebtoken");
const AccessControl = require("accesscontrol");
const Common = require("../common");
let ac;
let acm;

describe("AccessControlMiddleware", () => {
    before(done => {
        ac = new AccessControl();
        ac.grant("u-Admin").createAny("user");
        ac.grant("u-Admin").createOwn("user");
        ac.grant("u-Admin").updateOwn("profil");
        ac.deny("u-Admin").createAny("role");
        acm = new AccessControlMiddleware({
            secret: "MySecret", accessControl: ac, tokenFormat: "JWT", transformUserName: Common.computeUserName
        });
        done();
    });

    describe("hasRelatedToken", () => {
        it("should return false when no token is provided in request body", () => {
            expect(acm.hasRelatedToken({ body: "Foo" })).to.be.false;
        });
        it("should return true when token is provided in request body", () => {
            const token = jwt.sign({}, "MySecret", {
                expiresIn: 10080 // in seconds
            });
            expect(acm.hasRelatedToken({ token })).to.be.true;
        });

        it("should throw an exception when invoking method without argument", () => {
            expect(acm.hasRelatedToken).to.throw("Missing parameter : body")
        });
    });

    describe("checkRelated", () => {
        it("should return false when the token provided is not for the requested resource", () => {
            const payload = {
                user: {
                    id: 1,
                    name: "Admin"
                },
                profil: [
                    { id: "1", name: "bar" },
                    { id: "2", name: "bar" },
                    { id: "3", name: "bar" },
                    { id: "4", name: "bar" }
                ]
            };
            const relatedToken = jwt.sign({ data: { resource: "Foo", user: 1 } }, "MySecret", {
                expiresIn: 10080 // in seconds
            });
            expect(acm.checkRelated({ payload, token: relatedToken, resource: "Bar" })).to.be.false;
        });

        it("should return true when the token provided is valid", () => {
            const payload = {
                user: {
                    id: 1,
                    name: "Admin"
                },
                profil: [
                    { id: "1", name: "bar" },
                    { id: "2", name: "bar" },
                    { id: "3", name: "bar" },
                    { id: "4", name: "bar" }
                ]
            };
            const relatedToken = jwt.sign({ data: { resource: "Foo", user: 1 } }, "MySecret", {
                expiresIn: 10080 // in seconds
            });
            expect(acm.checkRelated({ payload, token: relatedToken, resource: "Foo" })).to.be.true;
        });

        it("should throw an exception when invoking method without argument", () => {
            expect(acm.checkRelated).to.throw("Missing parameters : token, resource")
        });

        it("should throw an exception when invoking method without token argument", () => {
            const relatedToken = jwt.sign({ data: { resource: "Foo" } }, "MySecret", {
                expiresIn: 10080 // in seconds
            });
            expect(() => { acm.checkRelated({ token: relatedToken }) }).to.throw("Missing parameter : resource");
        });

        it("should throw an exception when invoking method without resource argument", () => {
            expect(() => { acm.checkRelated({ resource: "Foo" }) }).to.throw("Missing parameter : token");
        });
    });
    describe("isMultipleResources", () => {
        it("should return true when an empty context is passed", () => {
            expect(acm.isMultipleResources({})).to.be.true;
        });
        it("should return false when an context is passed", () => {
            expect(acm.isMultipleResources({ source: "params", key: "fooId" })).to.be.false;
        });
    });

    describe("hasPermission", () => {
        it("should return true when the searched permission is contain is the permission object", () => {
            expect(acm.hasPermission(ac.can("u-Admin"), "createAny", "user")).to.be.true;
        });

        it("should return false when the searched permission is not contain is the permission object", () => {
            expect(acm.hasPermission(ac.can("u-Admin"), "createAny", "application")).to.be.false;
        });

        it("should return false when the searched permission is contain is the permission object but is not granted", () => {
            expect(acm.hasPermission(ac.can("u-Admin"), "createAny", "role")).to.be.false;
        });
    });

    describe("getActions", () => {
        it("should return an object corresponding to create actions", () => {
            expect(acm.getActions("create")).to.be.an("object");
            expect(acm.getActions("create")).to.not.be.empty;
            expect(acm.getActions("create")).to.have.property("any", "createAny");
            expect(acm.getActions("create")).to.have.property("own", "createOwn");
        });

        it("should return an object corresponding to update actions", () => {
            expect(acm.getActions("update")).to.be.an("object");
            expect(acm.getActions("update")).to.not.be.empty;
            expect(acm.getActions("update")).to.have.property("any", "updateAny");
            expect(acm.getActions("update")).to.have.property("own", "updateOwn");
        });

        it("should return an object corresponding to delete actions", () => {
            expect(acm.getActions("delete")).to.be.an("object");
            expect(acm.getActions("delete")).to.not.be.empty;
            expect(acm.getActions("delete")).to.have.property("any", "deleteAny");
            expect(acm.getActions("delete")).to.have.property("own", "deleteOwn");
        });

        it("should return an object corresponding to read actions", () => {
            expect(acm.getActions("read")).to.be.an("object");
            expect(acm.getActions("read")).to.not.be.empty;
            expect(acm.getActions("read")).to.have.property("any", "readAny");
            expect(acm.getActions("read")).to.have.property("own", "readOwn");
        });

        it("should throw an error when the action not exist", () => {
            expect(() => { acm.getActions("find") }).to.throw("Invalid action");
        });
    });

    describe("hasGeneric", () => {
        it("should return true when the user permissions object contain a generic permission corresponding with the one searched", () => {
            expect(acm.hasGeneric(ac.can("u-Admin"), acm.getActions("create"), "user")).to.be.true;
        });

        it("should return false when the user permissions object not contain a generic permission corresponding with the one searched", () => {
            expect(acm.hasGeneric(ac.can("u-Admin"), acm.getActions("create"), "application")).to.be.false;
        });
    });

    describe("hasGeneric", () => {
        it("should return true when the user permissions object contain a generic permission corresponding with the one searched", () => {
            expect(acm.hasGeneric(ac.can("u-Admin"), acm.getActions("create"), "user")).to.be.true;
        });

        it("should return false when the user permissions object not contain a generic permission corresponding with the one searched", () => {
            expect(acm.hasGeneric(ac.can("u-Admin"), acm.getActions("create"), "application")).to.be.false;
        });
    });

    describe("hasOwn", () => {
        it("should return true when the user permissions object contain a generic permission corresponding with the one searched", () => {
            expect(acm.hasOwn(ac.can("u-Admin"), acm.getActions("create"), "user")).to.be.true;
        });

        it("should return false when the user permissions object not contain a generic permission corresponding with the one searched", () => {
            expect(acm.hasOwn(ac.can("u-Admin"), acm.getActions("create"), "application")).to.be.false;
        });
    });

    describe("checkSpecific", () => {
        it("should should return true when the user token resource array contain the specified resource", () => {
            const resources = [
                { fkey: "1", type: "foo" }
            ];
            const resource = "foo"
            const fkey = "1";
            expect(acm.checkSpecific(resource, fkey, resources)).to.be.true;
        });

        it("should should return false when the user token resource array not contain the specified resource", () => {
            const resources = [
                { fkey: "1", type: "foo" }
            ];
            const resource = "foo"
            const fkey = "3";
            expect(acm.checkSpecific(resource, fkey, resources)).to.be.false;
        });

        it("should should return false when the user token resource array not contain the specified resource type", () => {
            const resources = [
                { fkey: "1", type: "foo" }
            ];
            const resource = "bar"
            const fkey = "1";
            expect(acm.checkSpecific(resource, fkey, resources)).to.be.false;
        });
    });

    describe("getUserName", () => {
        it("should return the name Admin extract from the request", () => {
            const reqStub = {
                user: {
                    name: "Admin"
                }
            };
            expect(acm.getUserName(reqStub)).to.be.eq("Admin");
        });
    });

    describe("filterResources", () => {
        it("should inject parameters into the req.query", () => {
            const reqStub = {
                query: {}
            };
            const resources = [
                { type: "foo", fkey: "1" },
                { type: "foo", fkey: "2" },
                { type: "foo", fkey: "3" },
                { type: "bar", fkey: "1" },
                { type: "baz", fkey: "2" },
            ]
            acm.filterResources(reqStub, resources, "foo");
            expect(reqStub.query.filters).to.be.not.empty;
            expect(reqStub.query.filters).to.have.property("id", `{"values":["1","2","3"],"operator":"in"}`);
        });
    });


    describe("filterResources", () => {
        it("should inject parameters into the req.query when filters id is passed", () => {
            const reqStub = {
                query: {
                    filters: {
                        id: JSON.stringify({ values: [1, 2], operator: "in" })
                    }
                }
            };
            const resources = [
                { type: "foo", fkey: "1" },
                { type: "foo", fkey: "2" },
                { type: "foo", fkey: "3" },
                { type: "bar", fkey: "1" },
                { type: "baz", fkey: "2" },
            ]
            acm.filterResources(reqStub, resources, "foo");
            expect(reqStub.query.filters).to.be.not.empty;
            expect(reqStub.query.filters).to.have.property("id", `{"values":["1","2"],"operator":"in"}`);
        });
    });

    describe("isAuthorized", () => {
        it("should return the result of the next function and response object must contains the validate permission when user have a generic permission", () => {
            const accessToken = jwt.sign({
                user: {
                    id: 1,
                    name: "Admin"
                }
            }, "MySecret", {
                    expiresIn: 10080 // in seconds
                });
            const resource = "user";
            const action = "create";
            const reqStub = {
                headers: {
                    authorization: accessToken
                },
                body: {

                }
            };
            const resStub = {};
            const nextStub = () => { return "ok" };
            expect(acm.isAuthorized({ resource, action, req: reqStub, res: resStub, next: nextStub })).to.be.true;
            expect(resStub.permission).to.be.not.empty;
        });

        it("should return the result of the next function and response object must contains the validate permission when user have a specific permission and accessing list of resource", () => {
            const accessToken = jwt.sign({
                user: {
                    id: 1,
                    name: "Admin"
                },
                resources: [
                    { type: "profil", fkey: 1 }
                ]
            }, "MySecret", {
                    expiresIn: 10080 // in seconds
                });
            const resource = "profil";
            const action = "update";
            const reqStub = {
                headers: {
                    authorization: accessToken
                },
                body: {

                },
                query: {}
            };
            const resStub = {};
            const nextStub = () => { return "ok" };
            expect(acm.isAuthorized({ resource, action, req: reqStub, res: resStub, next: nextStub })).to.be.true;
            expect(resStub.permission).to.be.not.empty;
        });

        it("should return the result of the next function and response object must contains the validate permission when user have a specific/dynamic permission", () => {
            const accessToken = jwt.sign({
                user: {
                    id: 1,
                    name: "Admin"
                }
            }, "MySecret", {
                    expiresIn: 10080 // in seconds
                });
            const resource = "user";
            const action = "create";
            const reqStub = {
                headers: {
                    authorization: accessToken
                },
                body: {}
            };
            const context = {
                source: "params",
                key: "fooId"
            }
            const resStub = {};
            const nextStub = () => { return "ok" };
            expect(acm.isAuthorized({ resource, action, context, req: reqStub, res: resStub, next: nextStub })).to.be.true;
            expect(resStub.permission).to.be.not.empty;
        });

        it("should return the result of the next function and response object must contains the validate permission when user have a specific permission", () => {
            const accessToken = jwt.sign({
                user: {
                    id: 1,
                    name: "Admin"
                },
                resources: [
                    { fkey: "1", type: "profile" }
                ]
            }, "MySecret", {
                    expiresIn: 10080 // in seconds
                });
            const resource = "profil";
            const action = "update";
            const reqStub = {
                headers: {
                    authorization: accessToken
                },
                body: {},
                params: {
                    fooId: "1"
                }
            };
            const context = {
                type: "profile",
                source: "params",
                key: "fooId"
            }
            const resStub = {};
            const nextStub = () => { return "ok" };
            expect(acm.isAuthorized({ resource, action, context, req: reqStub, res: resStub, next: nextStub })).to.be.true;
            expect(resStub.permission).to.be.not.empty;
        });

        it("should set status response to 403 with invalid action when using invalid action", () => {
            const resource = "profil";
            const action = "find";
            const reqStub = {

            };
            const resStub = {
                status: null,
                message: null,
                status: function (code) {
                    this.status = code;
                    return this;
                },
                send: function (message) {
                    this.message = message;
                }

            };
            const nextStub = () => { return "ok" };
            expect(() => acm.isAuthorized({ resource, action, context, req: reqStub, res: resStub, next: nextStub })).to.throw("Invalid action");
            // expect(resStub.status).to.be.eq(403);
            // expect(resStub.message).to.be.eq("Invalid action");
        });

        it("should bypass other check when relatedToken is passed in request body", () => {
            const accessToken = jwt.sign({
                user: {
                    id: 1,
                    name: "Admin"
                },
                profil: [
                    { id: "1", name: "bar" },
                    { id: "2", name: "bar" },
                    { id: "3", name: "bar" },
                    { id: "4", name: "bar" }
                ]
            }, "MySecret", {
                    expiresIn: 10080 // in seconds
                });
            const relatedToken = jwt.sign({
                data: {
                    resource: "bar",
                    user: 1,
                    typeAction: "create",
                    possession: "any"
                }
            }, "MySecret", {
                    expiresIn: 10080 // in seconds
                });
            const resource = "bar";
            const action = "create";
            const reqStub = {
                headers: {
                    authorization: accessToken
                },
                body: {
                    token: relatedToken
                },
            };
            const resStub = {};
            const nextStub = () => { return "ok" };
            expect(acm.isAuthorized({ resource, action, context, req: reqStub, res: resStub, next: nextStub })).to.be.true;
            expect(resStub.permission).to.be.not.empty;
        });

        it("should not bypass other check when relatedToken is passed in request body but user give does not match", () => {
            const accessToken = jwt.sign({
                user: {
                    id: 1,
                    name: "Admin"
                },
                profil: [
                    { id: "1", name: "bar" },
                    { id: "2", name: "bar" },
                    { id: "3", name: "bar" },
                    { id: "4", name: "bar" }
                ]
            }, "MySecret", {
                    expiresIn: 10080 // in seconds
                });
            const relatedToken = jwt.sign({
                data: {
                    resource: "bar",
                    user: 2,
                    typeAction: "create",
                    possession: "any"
                }
            }, "MySecret", {
                    expiresIn: 10080 // in seconds
                });
            const resource = "bar";
            const action = "create";
            const reqStub = {
                headers: {
                    authorization: accessToken
                },
                body: {
                    token: relatedToken
                },
            };
            const resStub = {
                status: null,
                message: null,
                status: function (code) {
                    this.status = code;
                    return this;
                },
                send: (message) => {
                    this.message = message;
                }

            };
            const nextStub = () => { return "ok" };
            expect(acm.isAuthorized({ resource, action, context, req: reqStub, res: resStub, next: nextStub })).to.be.false;
        });
        it("should send response 403 when token verification failed", () => {
            const accessToken = jwt.sign({
                user: {
                    id: 1,
                    name: "Admin"
                },
                profil: [
                    { id: "1", name: "bar" },
                    { id: "2", name: "bar" },
                    { id: "3", name: "bar" },
                    { id: "4", name: "bar" }
                ]
            }, "Foo", {
                    expiresIn: 10080 // in seconds
                });
            const resource = "bar";
            const action = "create";
            const reqStub = {
                headers: {
                    authorization: accessToken
                },
            }
            const resStub = {
                status: null,
                message: null,
                status: function (code) {
                    this.status = code;
                    return this;
                },
                send: (message) => {
                    this.message = message;
                }

            };
            const nextStub = () => { return "ok" };
            expect(() => acm.isAuthorized({ resource, action, context, req: reqStub, res: resStub, next: nextStub }).to.throw("invalid signature"));
        });
    });

    describe("computeAuthorizations", () => {
        it("should validate when both authorizations are ok", () => {
            const accessToken = jwt.sign({
                user: {
                    id: 1,
                    name: "Admin"
                }
            }, "MySecret", { expiresIn: 10080 });
            const authorizations = [{
                resource: "user",
                action: "create"
            },
            {
                resource: "role",
                action: "create"
            }]
            const reqStub = {
                headers: {
                    authorization: accessToken
                },
                body: {

                }
            }
            const resStub = {};
            const nextStub = () => { return "ok" };
            acm.computeAuthorizations({ authorizations, req: reqStub, res: resStub, next: nextStub });
            expect(resStub.permission).to.be.not.empty;
        });

        it("should validate when only one authorizations are ok", () => {
            const accessToken = jwt.sign({
                user: {
                    id: 1,
                    name: "Admin"
                }
            }, "MySecret", { expiresIn: 10080 });
            const authorizations = [{
                resource: "user",
                action: "create"
            },
            {
                resource: "foo",
                action: "create"
            }]
            const reqStub = {
                headers: {
                    authorization: accessToken
                },
                body: {

                }
            }
            const resStub = {};
            const nextStub = () => { return "ok" };
            acm.computeAuthorizations({ authorizations, req: reqStub, res: resStub, next: nextStub });
            expect(resStub.permission).to.be.not.empty;
        });

        it("should not validate when both authorizations are not ok", () => {
            const accessToken = jwt.sign({
                user: {
                    id: 1,
                    name: "Admin"
                }
            }, "MySecret", { expiresIn: 10080 });
            const authorizations = [{
                resource: "bar",
                action: "create"
            },
            {
                resource: "foo",
                action: "create"
            }]
            const reqStub = {
                headers: {
                    authorization: accessToken
                },
                body: {

                }
            }
            const resStub = {
                status: null,
                message: null,
                status: function (code) {
                    this.status = code;
                    return this;
                },
                send: (message) => {
                    this.message = message;
                }

            };
            const nextStub = () => { return "ok" };
            acm.computeAuthorizations({ authorizations, req: reqStub, res: resStub, next: nextStub });
            expect(resStub.status).to.be.eq(403);
        });

        it("should validate when one of authorizations actions does not exists and other authorizations is ok", () => {
            const accessToken = jwt.sign({
                user: {
                    id: 1,
                    name: "Admin"
                }
            }, "MySecret", { expiresIn: 10080 });
            const authorizations = [{
                resource: "user",
                action: "foo"
            },
            {
                resource: "profil",
                action: "update"
            }]
            const reqStub = {
                headers: {
                    authorization: accessToken
                },
                body: {

                }
            }
            const resStub = {
                statusCode: null,
                message: null,
                status: function (code) {
                    this.statusCode = code;
                    return this;
                },
                send: (message) => {
                    this.message = message;
                }

            };
            const nextStub = () => { return "ok" };
            acm.computeAuthorizations({ authorizations, req: reqStub, res: resStub, next: nextStub });
            expect(resStub.permission).to.be.not.empty;
        });
    });
});
