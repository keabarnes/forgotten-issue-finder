export const removeDuplicateLinks = (arr: Array<string>): Array<string> => {
  var result: Array<string> = [];
  arr.forEach(function (item) {
    if (result.indexOf(item) < 0) {
      result.push(item);
    }
  });
  return result;
};
