const {
  MAX_PAGE_SIZE,
  clampPagination,
} = require("../helper/paginationHelper");

describe("pagination bounds", () => {
  test("caps page size and normalizes page numbers", () => {
    const values = clampPagination({
      perpage: "9999999",
      pageNumber: "-20",
      pageSize: "0",
    });

    expect(values.perpage).toBe(String(MAX_PAGE_SIZE));
    expect(values.pageNumber).toBe("1");
    expect(values.pageSize).toBe("1");
  });
});
