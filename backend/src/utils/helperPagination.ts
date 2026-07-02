export const getPagination = (page: any, limit: any) => {
  const currentPage = parseInt(page) || 1;
  const itemsPerPage = parseInt(limit) || 10;
  const offset = (currentPage - 1) * itemsPerPage;

  return { currentPage, itemsPerPage, offset };
};

export const getMeta = (totalData: number, currentPage: number, limit: number) => {
  const totalPage = Math.ceil(totalData / limit);

  return {
    totalData,
    currentPage,
    itemsPerPage: limit,
    totalPage,
    // Tambahkan flag navigasi
    hasPreviousPage: currentPage > 1,
    hasNextPage: currentPage < totalPage,
    nextPage: currentPage < totalPage ? currentPage + 1 : null,
    previousPage: currentPage > 1 ? currentPage - 1 : null
  };
};

// export const getMeta = (totalData: number, currentPage: number, limit: number) => {
//   return {
//     totalData,
//     currentPage,
//     itemsPerPage: limit,
//     totalPage: Math.ceil(totalData / limit)
//   };
// };