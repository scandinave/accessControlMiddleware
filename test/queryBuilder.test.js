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