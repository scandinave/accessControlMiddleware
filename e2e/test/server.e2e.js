const chai = require("chai");
chai.use(require("chai-http"));
chai.use(require("chai-like"));
chai.use(require("chai-things"));
chai.use(require("chai-sorted"));
const server = require("../server/server");
const should = chai.should();
const expect = chai.expect();
const Jwt = require("jsonwebtoken");
const ExtractJwt = require("passport-jwt").ExtractJwt;
const httpCode = require("../http_code");
const common = require("../../common");

let loginRequest;
let token;
describe("e2e", () => {

    beforeEach(async () => {
        loginRequest = chai.request(server).post(`/login`).set("Content-Type", "application/json");
        const res = await loginRequest.send({
            email: "foo.bar@baz.com",
            password: "bar"
        });

        token = res.body.token;
    });

    it("should have login endpoint", async () => {
        const res = await loginRequest.send({
            email: "foo.bar@baz.com",
            password: "foo"
        });
        res.status.should.not.be.eql(httpCode.HTTP_NOT_FOUND);
    });

    describe("FindAll", () => {

        it("should be able to get access generic resources", async () => {
            const res = await chai.request(server)
                .get(`/bar`)
                .set("Content-Type", "application/json")
                .set("Authorization", `bearer ${token}`)
                .send();
            res.status.should.be.eql(httpCode.HTTP_OK);
        });

        it("should be able to get access filter list of resources via generic authorizations", async () => {
            const res = await chai.request(server)
                .get(`/foo`)
                .set("Content-Type", "application/json")
                .set("Authorization", `bearer ${token}`)
                .send();
            res.status.should.be.eql(httpCode.HTTP_OK);
        });

        it("should not be able to get access generic resources without permissions", async () => {
            const res = await chai.request(server)
                .get(`/baz`)
                .set("Content-Type", "application/json")
                .set("Authorization", `bearer ${token}`)
                .send();
            res.status.should.be.eql(httpCode.HTTP_FORBIDDEN);
        });

        it("should be able to access a generic resources that have multiple authorizations", async () => {
            const res = await chai.request(server)
                .get(`/multiple`)
                .set("Content-Type", "application/json")
                .set("Authorization", `bearer ${token}`)
                .send();
            res.status.should.be.eql(httpCode.HTTP_OK);
        });
    });

    describe("Find", () => {
        it("should be able to access specific resource", async () => {
            const res = await chai.request(server)
                .get(`/foo/1`)
                .set("Content-Type", "application/json")
                .set("Authorization", `bearer ${token}`)
                .send();
            res.status.should.be.eql(httpCode.HTTP_OK);
        });
    });

    describe("CheckRelated", () => {
        it("should be able to access related resources.", async () => {
            const res = await chai.request(server)
                .get(`/foo/1`)
                .set("Content-Type", "application/json")
                .set("Authorization", `bearer ${token}`)
                .send();

            const relatedToken = res.body.links.related[0].split("token=")[1];
            const resRelated = await chai.request(server)
                .get(`/baz`)
                .set("Content-Type", "application/json")
                .set("Authorization", `bearer ${token}`)
                .query({ token: relatedToken })
            resRelated.status.should.be.eql(httpCode.HTTP_OK);
        });
    });
});