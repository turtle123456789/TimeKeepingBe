function formatDateCustom(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0'); // Ensure 2-digit day

  return `${year}-${month}-${day}`;
}

module.exports = formatDateCustom; 