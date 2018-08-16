"use strict";
//process.env.NODE_ENV = 'test';
const chai = require("chai");
const should = chai.should();
const expect = chai.expect;
const Common = require("../common");
const jwt = require("jsonwebtoken");

/**
* Début des test
*/
describe("Common", () => {
    describe("isEmpty", () => {

        it("should return true when undefined value is passed", () => {
            let undefinedValue;
            expect(Common.isEmpty(undefinedValue)).to.be.true;
        });
        it("should return true when null value is passed", () => {
            const nullValue = null;
            expect(Common.isEmpty(nullValue)).to.be.true;
        });

        it("should return true when empty array value is passed", () => {
            const emptyArray = [];
            expect(Common.isEmpty(emptyArray)).to.be.true;
        });

        it("should return true when using empty object value", () => {
            const emptyObject = {};
            expect(Common.isEmpty(emptyObject)).to.be.true;
        });
    });

    describe("isNotEmpty", () => {
        it("should return true when a value is passed", () => {
            expect(Common.isNotEmpty(5)).to.be.true;
        });
        it("should return true when a array is passed", () => {
            expect(Common.isNotEmpty([2, 3, 4])).to.be.true;
        });

        it("should return true when using object value", () => {
            const objectStub = {
                foo: "bar"
            };
            expect(Common.isNotEmpty(objectStub)).to.be.true;
        });
    });

    describe("isDefined", () => {
        it("should return true when a value is passed", () => {
            expect(Common.isDefined(5)).to.be.true;
        });
        it("should return true when a array is passed", () => {
            expect(Common.isDefined([2, 3, 4])).to.be.true;
        });

        it("should return true when using object value", () => {
            const objectStub = {
                foo: "bar"
            };
            expect(Common.isDefined(objectStub)).to.be.true;
        });
    });

    describe("isNotDefined", () => {
        it("should return true when undefined value is passed", () => {
            let undefinedValue;
            expect(Common.isNotDefined(undefinedValue)).to.be.true;
        });
        it("should return true when null value is passed", () => {
            const nullValue = null;
            expect(Common.isNotDefined(nullValue)).to.be.true;
        });

        it("should return false when empty array value is passed", () => {
            const emptyArray = [];
            expect(Common.isNotDefined(emptyArray)).to.be.false;
        });

        it("should return false when using empty object value", () => {
            const emptyObject = {};
            expect(Common.isNotDefined(emptyObject)).to.be.false;
        });
    });

    describe("verifyToken", () => {
        it("should verify a Bearer token", () => {
            const token = jwt.sign({ data: { resource: "Foo" } }, "MySecret", {
                expiresIn: 10080 // in seconds
            });
            expect(Common.verifyToken(`Bearer ${token}`, "MySecret")).to.be.an("object");
        });

        it("should failed when bad secret is used a Bearer token", () => {
            const token = jwt.sign({ data: { resource: "Foo" } }, "MySecret", {
                expiresIn: 10080 // in seconds
            });
            expect(() => Common.verifyToken(`Bearer ${token}`, "toto")).to.throw("invalid signature");
        });
    });
});