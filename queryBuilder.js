"use strict";
const Common = require("./common");

/**
 * Build a query that can be consume directly by service that need REST parameters.
 */
class QueryBuilder {


  /**
   * Get a instance of QueryBuilder.
   * @param {{}} params An options object that contains parameter to apply on the query.
   * @param {Array} params.fields The fields to include in the response
   * @param {QueryParamsFilter[]} params.filters The filters to apply on the query
   * @param {Array} params.sort The sort order of the result.
   * @param {Array} params.include The eager relations to include.
   * @param {Array} params.page The page to display.
   */
  constructor({ fields = [], filters = [], sort = [], includes = [], page } = {}) {
    // if (!Array.isArray(fields)) {
    //   throw new Error("fields must be a Array object.");
    // }
    if (!Array.isArray(filters)) {
      throw new Error("filters must be a Array object.");
    }
    // if (!Array.isArray(sort)) {
    //   throw new Error("sort must be a Array object.");
    // }
    // if (!Array.isArray(includes)) {
    //   throw new Error("includes must be a Array object.");
    // }
    // if (Common.isNotEmpty(page) && !(page instanceof QueryParamsPage)) {
    //   throw new Error("page must be a QueryParamsPage object.");
    // }
    // this.fields = fields;
    this.filters = filters;
    // this.sort = sort;
    // this.includes = includes;
    // this.page = page;
  }


  /**
   * Build all parameters into a object that can be consume by service.
   * @return {Object} options object.
   */
  build() {
    const queryParams = {};
    // queryParams.filters = [];
    // if (Common.isNotEmpty(this.fields)) {
    //   queryParams.fields = this.fields;
    // }

    if (Common.isNotEmpty(this.filters)) {
      this.filters.forEach(filter => {
        queryParams.filters = {};
        queryParams.filters[filter.filterName] = {};
        queryParams.filters[filter.filterName].values = filter.filterValues;
        queryParams.filters[filter.filterName].operator = filter.operator;
      });
    }

    // if (Common.isNotEmpty(this.sort)) {
    //   this.sort.forEach(sort => {
    //     queryParams.sort = {};
    //     queryParams.sort[sort.field] = sort.order;
    //   });
    // }
    // if (Common.isNotEmpty(this.includes)) {
    //   queryParams.includes = this.includes.join(",");
    // }

    // if (Common.isNotEmpty(this.page)) {
    //   queryParams.offset = this.page.offset;
    //   queryParams.limit = this.page.limit;
    // }

    return queryParams;
  }
}

/**
 * Build a filter parameter that can be pass to QueryBuilder object.
 */
class QueryParamsFilter {

  /**
   * Build a filter parameter that can be pass to QueryBuilder object.
   * @param {{}} params An options object that contains parameter to apply on the query.
   * @param {String} params.filterName The filter name to apply
   * @param {String} params.filterValue The filter value.
   * @param {QueryParamsFilterOperator} params.operator The operation that will be execute on the filter passed to the query.
   */
  constructor({ filterName, filterValues, operator = QueryParamsFilterOperator.EQ } = {}) {
    if (!Common.isString(filterName)) {
      throw new Error("filterName must be a String object.");
    }
    if (!Array.isArray(filterValues)) {
      throw new Error("filterValue must be an Array object.");
    }
    if (!Common.isString(operator)) {
      throw new Error("operator must be a QueryParamsFilterOperator enum.");
    }
    this.filterName = filterName;
    this.filterValues = filterValues;
    this.operator = operator;
  }
}

/**
 * Build a sort parameter that can be pass to QueryBuilder object.
 */
// class QueryParamsSort {
//   /**
//    * Build a sort parameter that can be pass to QueryBuilder object.
//    * @param {{}} params An options object that contains parameter to apply on the query.
//    * @param {String} params.field The field to sort
//    * @param {SortOrder} params.order The order of the sort to apply on the field
//    */
//   constructor({ field, order = SortOrder.ASC } = {}) {
//     if (!Common.isString(field)) {
//       throw new Error("field must be a String object.");
//     }
//     if (!Common.isString(order)) {
//       throw new Error("order must be a SortOrder enum.");
//     }
//     this.field = field;
//     this.order = order;
//   }


// }

/**
 * Return only a subset off the results provide by the query.
 */
// class QueryParamsPage {

//   /**
//    * Return only a subset off the results provide by the query.
//    * By default this return the first 10 results.
//    * @param {{}} params An options object that contains parameter to apply on the query.
//    * @param {Number} params.offset The field to sort
//    * @param {Number} params.limit The order of the sort to apply on the field
//    */
//   constructor({ offset = 0, limit = 10 }) {
//     if (!Common.isNumber(offset)) {
//       throw new Error("offset must be a Number object.");
//     }
//     if (!Common.isNumber(limit)) {
//       throw new Error("limit must be a Number object.");
//     }
//     this.offset = offset;
//     this.limit = limit;
//   }
// }


// const SortOrder = {
//   ASC: "asc",
//   DESC: "desc"
// };

const QueryParamsFilterOperator = {
  EQ: "eq",
  DIFF: "ned",
  LIKE: "like",
  LT: "lt",
  LEQ: "leq",
  GT: "gt",
  GEQ: "geq",
  IN: "in",
  NOTIN: "not in"
};

module.exports = {
  QueryBuilder,
  QueryParamsFilter,
  QueryParamsFilterOperator,
  // QueryParamsPage,
  // QueryParamsSort,
  // SortOrder
};
