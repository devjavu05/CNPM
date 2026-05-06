function buildCategoryCode(category) {
  if (!category) return "GEN";
  const normalized = String(category)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");

  const tokens = normalized.toUpperCase().split(/[^A-Z0-9]+/).filter(Boolean);
  return tokens.map((token) => token[0]).join("") || "GEN";
}

export const LIBRARY_FLOORS = [1, 2, 3];

export function getShelfCode(category) {
  return buildCategoryCode(category);
}

export function getShelfName(category) {
  return category ? `Kệ ${getShelfCode(category)}` : "";
}

export function getBookLocation(category, floorNumber) {
  if (!category || !floorNumber) return "";
  return `Tầng ${floorNumber} - ${getShelfName(category)} - ${category}`;
}

export function decodeShelfLocation(location, category) {
  if (!location) return null;
  const normalized = String(location).trim();
  const match = normalized.match(/^Tầng\s+(\d+)\s+-\s+(Kệ\s+[A-Z0-9]+)\s+-\s+(.+)$/i);

  if (!match) {
    return {
      floorNumber: null,
      shelfName: category ? getShelfName(category) : null,
      categoryName: category || null,
      humanText: normalized
    };
  }

  return {
    floorNumber: Number(match[1]),
    shelfName: match[2],
    categoryName: match[3],
    humanText: `Tầng ${match[1]}, ${match[2]}, ${match[3]}`
  };
}

export function decodeBookBarcode(barcode) {
  if (!barcode) return null;
  const normalized = String(barcode).trim().toUpperCase();
  const match = normalized.match(/^T(\d{2})-K([A-Z0-9]+)-([A-Z]+)-(\d{3})$/);

  if (!match) {
    return {
      floorCode: null,
      shelfCode: null,
      categoryCode: null,
      sequence: null,
      humanText: normalized
    };
  }

  return {
    floorCode: match[1],
    shelfCode: match[2],
    categoryCode: match[3],
    sequence: match[4],
    humanText: `Tầng ${Number(match[1])} • Kệ ${match[2]} • ${match[3]} • Bản ${match[4]}`
  };
}
