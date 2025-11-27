/**
 * Smartly finds the actual list of data inside a JSON structure.
 */
export const normalizeJSON = (data) => {
  if (Array.isArray(data)) {
    if (data.length > 0 && typeof data[0] !== 'object') {
      return data.map(val => ({ "Value": val }));
    }
    return data;
  }

  if (typeof data === 'object' && data !== null) {
    const commonKeys = ['data', 'results', 'items', 'records', 'rows', 'entities'];
    for (const key of commonKeys) {
      if (Array.isArray(data[key])) {
        return data[key];
      }
    }

    let largestArray = null;
    let maxLen = 0;

    Object.values(data).forEach(value => {
      if (Array.isArray(value) && value.length > maxLen) {
        maxLen = value.length;
        largestArray = value;
      }
    });

    if (largestArray) return largestArray;

    return [data];
  }

  return [];
};

/**
 * Flattens nested objects into dot notation.
 */
export const flattenJSON = (data) => {
  return data.map(item => {
    const flatItem = {};

    const flatten = (obj, prefix = '') => {
      for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
          flatten(obj[key], `${prefix}${key}.`);
        } else {
          flatItem[`${prefix}${key}`] = Array.isArray(obj[key]) ? JSON.stringify(obj[key]) : obj[key];
        }
      }
    };

    flatten(item);
    return flatItem;
  });
};