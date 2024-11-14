export function normalizeBooleanParam(param) {
  if (param === 'true' || param === true) {
    return true;
  }
  if (param === 'false' || param === false) {
    return false;
  }
}
