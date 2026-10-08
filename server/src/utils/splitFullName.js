// Surname particles common in Filipino names: "Juan Dela Cruz" -> last name "Dela Cruz".
const PARTICLES = new Set(['de', 'dela', 'del', 'delos', 'de los', 'de la', 'san', 'sta', 'sta.', 'santa', 'van', 'von', 'la', 'los', 'las']);
const SUFFIXES = new Set(['jr', 'jr.', 'sr', 'sr.', 'ii', 'iii', 'iv']);

/**
 * Splits the single "Full Name" registration field into first/last/suffix.
 * Accepts "Last, First Middle" too. Middle names stay inside firstName since a
 * single field can't tell "Maria Clara" (two given names) from a middle name.
 */
const splitFullName = (fullName = '') => {
  const clean = fullName.replace(/\s+/g, ' ').trim();
  if (!clean) return { firstName: '', lastName: '' };

  if (clean.includes(',')) {
    const [last, rest] = clean.split(',').map((s) => s.trim());
    return { firstName: rest || last, lastName: rest ? last : last };
  }

  const parts = clean.split(' ');
  let suffix;
  if (parts.length > 2 && SUFFIXES.has(parts[parts.length - 1].toLowerCase())) suffix = parts.pop();
  if (parts.length === 1) return { firstName: parts[0], lastName: parts[0], suffix };

  let lastStart = parts.length - 1;
  while (lastStart > 1 && PARTICLES.has(parts[lastStart - 1].toLowerCase())) lastStart -= 1;

  return {
    firstName: parts.slice(0, lastStart).join(' '),
    lastName: parts.slice(lastStart).join(' '),
    suffix,
  };
};

module.exports = { splitFullName };
