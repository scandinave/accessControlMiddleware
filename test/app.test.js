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
let ac;
let acm;

describe("AccessControlMiddleware", () => {
    before(done => {
        ac = new AccessControl();
        ac.grant("u-Admin").createAny("user");
        ac.grant("u-Admin").createOwn("user");
        ac.grant("u-Admin").updateOwn("profil");
        ac.deny("u-Admin").createAny("role");
        acm = new AccessControlMiddleware("MySecret", ac);
        done();
    })
    describe("hasRelatedToken", () => {
        it("should return false when no token is provided in request body", () => {
            expect(acm.hasRelatedToken({body: "Foo"})).to.be.false;
        });
        it("should return true when token is provided in request body", () => {
            const relatedToken = jwt.sign({}, "MySecret", {
                expiresIn: 10080 // in seconds
            });
            expect(acm.hasRelatedToken({relatedToken})).to.be.true;
        });

        it("should throw an exception when invoking method without argument", () => {
            expect(acm.hasRelatedToken).to.throw("Missing parameter : body")
        });
    });

    describe("checkRelated", () => {
        it("should return true when the token provided is not valid", () => {
            const relatedToken = jwt.sign({grants: {resource: "Foo"}}, "MySecret", {
                expiresIn: 10080 // in seconds
            });
            expect(acm.checkRelated({token: relatedToken, resource: "Bar"})).to.be.false;
        });

        it("should return false when the token provided is valid", () => {
            const relatedToken = jwt.sign({grants: {resource: "Foo"}}, "MySecret", {
                expiresIn: 10080 // in seconds
            });
            expect(acm.checkRelated({token: relatedToken, resource: "Foo"})).to.be.true;
        });

        it("should throw an exception when invoking method without argument", () => {
            expect(acm.checkRelated).to.throw("Missing parameters : token, resource")
        });
    });
    describe("isMultipleResources", () => {
        it("should return true when an empty context is passed", () => {
            expect(acm.isMultipleResources({})).to.be.true;
        });
        it("should return false when an context is passed", () => {
            expect(acm.isMultipleResources({source: "params", key: "fooId"})).to.be.false;
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
            expect(() => {acm.getActions("find")}).to.throw("Invalid action");
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
                {fkey: "1", type: "foo"}
            ];
            const resource = "foo"
            const fkey = "1";
            expect(acm.checkSpecific(resource, fkey, resources)).to.be.true;
        });

        it("should should return false when the user token resource array not contain the specified resource", () => {
            const resources = [
                {fkey: "1", type: "foo"}
            ];
            const resource = "foo"
            const fkey = "3";
            expect(acm.checkSpecific(resource, fkey, resources)).to.be.false;
        });

        it("should should return false when the user token resource array not contain the specified resource type", () => {
            const resources = [
                {fkey: "1", type: "foo"}
            ];
            const resource = "bar"
            const fkey = "1";
            expect(acm.checkSpecific(resource, fkey, resources)).to.be.false;
        });
    });

    describe("checkDynamique", () => {
        it("should return true when the user token contains the specified resource as a related resource.", () => {
            const resources = [
                {id: "1", bar: "foo"}
            ];
            const resource = "bar"
            const fkey = "1";
            expect(acm.checkDynamic(fkey, resources)).to.be.true;
        });

        it("should return false when the user token not contains the specified resource as a related resource.", () => {
            const resources = [
                {id: "1", bar: "foo"}
            ];
            const fkey = "2";
            expect(acm.checkDynamic(fkey, resources)).to.be.false;
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

    describe("isAuthorized", () => {
        it("should return the result of the next function and response object must contains the validate permission when user have a generic permission", () => {
            const resource = "user";
            const action = "create";
            const reqStub = {
                user: {
                    name: "Admin"
                },
                body: {

                }
            };
            const resStub = {};
            const nextStub = () => {return "ok"};
            expect(acm.isAuthorized({resource, action, req: reqStub, res: resStub, next: nextStub})).to.be.eq("ok");
            expect(resStub.permission).to.be.not.empty;
        });

        it("should return the result of the next function and response object must contains the validate permission when user have a specific/dynamic permission and accessing list of resource", () => {
            const resource = "profil";
            const action = "update";
            const reqStub = {
                user: {
                    name: "Admin"
                },
                body: {

                }
            };
            const resStub = {};
            const nextStub = () => {return "ok"};
            expect(acm.isAuthorized({resource, action, req: reqStub, res: resStub, next: nextStub})).to.be.eq("ok");
            expect(resStub.permission).to.be.not.empty;
        });

        it("should return the result of the next function and response object must contains the validate permission when user have a specific/dynamic permission", () => {
            const resource = "user";
            const action = "create";
            const reqStub = {
                user: {
                    name: "Admin"
                },
                body: {

                }
            };
            const context = {
                source: "params",
                key: "foo.Id"
            }
            const resStub = {};
            const nextStub = () => {return "ok"};
            expect(acm.isAuthorized({resource, action, context, req: reqStub, res: resStub, next: nextStub})).to.be.eq("ok");
            expect(resStub.permission).to.be.not.empty;
        });

        it("should return the result of the next function and response object must contains the validate permission when user have a specific permission", () => {
            const resource = "profil";
            const action = "update";
            const reqStub = {
                user: {
                    name: "Admin"
                },
                body: {}
            };
            const context = {
                source: "params",
                key: "foo.Id"
            }
            const resStub = {};
            const nextStub = () => {return "ok"};
            expect(acm.isAuthorized({resource, action, context, req: reqStub, res: resStub, next: nextStub})).to.be.eq("ok");
            expect(resStub.permission).to.be.not.empty;
        });
    });
});
