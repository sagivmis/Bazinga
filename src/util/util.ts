export const getDecimal = (value: number) => {
  return value.toString().split(".")[1].length || 0
}
