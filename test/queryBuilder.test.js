"use strict";
//process.env.NODE_ENV = 'test';
const chai = require("chai");
const should = chai.should();
const expect = chai.expect;
const Common = require("../common");
const QueryBuilder = require("../queryBuilder").QueryBuilder;
const QueryParamsFilter = require("../queryBuilder").QueryParamsFilter;
const QueryParamsFilterOperator = require("../queryBuilder").QueryParamsFilterOperator;
const QueryParamsSort = require("../queryBuilder").QueryParamsSort;
const SortOrder = require("../queryBuilder").SortOrder;

/**
* Début des test
*/
describe("Common", () => {

    describe("QueryBuilder", () => {
        it("should throw exception when not passing array as filter", () => {
            expect(() => new QueryBuilder({ filters: "" })).to.throw("filters must be a Array object.")
        });
        describe("build", () => {
            it("should build the correct query when using filter", () => {
                const resourcesId = [1, 2, 3, 4];
                const queryParamsFilter = [new QueryParamsFilter({ filterName: "id", filterValues: resourcesId, operator: QueryParamsFilterOperator.IN })];
                const query = new QueryBuilder({ filters: queryParamsFilter }).build();
                expect(query.filters).to.be.not.empty;
                expect(query.filters.id.values).to.be.eq(resourcesId);
                expect(query.filters.id.operator).to.be.eq(QueryParamsFilterOperator.IN);
            });

            // it("should build the correct query when using sort", () => {
            //     const queryParamsSort = [new QueryParamsSort({ field: "foo", sort: SortOrder.ASC })];
            //     const query = new QueryBuilder({ sort: queryParamsSort }).build();
            //     expect(query.sort).to.be.not.empty;
            //     expect(query.sort.foo).to.be.eq(`asc`);
            // });
        });
    });
    describe("QueryParamFilter", () => {
        it("should throw exception when not passing a string as filter name", () => {
            expect(() => new QueryParamsFilter({ filterName: 2 })).to.throw("filterName must be a String object.")
        });
        it("should throw exception when not passing an array as filter values", () => {
            expect(() => new QueryParamsFilter({ filterName: "", filterValues: "" })).to.throw("filterValue must be an Array object.")
        });
        it("should throw exception when not passing a string as operator", () => {
            expect(() => new QueryParamsFilter({ filterName: "", filterValues: [], operator: 2 })).to.throw("operator must be a QueryParamsFilterOperator enum.")
        });;
    });
});