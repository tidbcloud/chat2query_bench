export function isTimeField(name: string): boolean {
  return /date|time|year|month/.test(name);
}

export function isYearLike(value: string | number): boolean {
  if (typeof value === "number") {
    return value >= 1970 && value < 2100;
  } else {
    return isYearLike(Number(value));
  }
}

export function transformTimeData(data: any[], field: string) {
  return data.map((item) => {
    let value = item[field];
    if (isYearLike(value)) {
      value = new Date(String(value));
    }
    return { ...item, [field]: value };
  });
}

export function isNumberFiled(column: string) {
  return ["DECIMAL", "INT", "DOUBLE", "BIGINT"].includes(column);
}

export function isNumeric(str: string | number) {
  if (typeof str !== "string") return false;
  return !isNaN(str as any) && !isNaN(parseFloat(str));
}

export function isValidDataType(dataType: string) {
  const mysqlDataTypes = [
    "INT",
    "FLOAT",
    "DOUBLE",
    "DECIMAL",
    "DATE",
    "DATETIME",
    "TIMESTAMP",
    "CHAR",
    "TEXT",
  ];
  const regex = /^VARCHAR\(\d+\)$/i; // regex pattern to match VARCHAR with length
  return (
    mysqlDataTypes.includes(dataType.toUpperCase()) || regex.test(dataType)
  );
}

export const range = (n: number) => Array.from({ length: n }).map((_, i) => i);
