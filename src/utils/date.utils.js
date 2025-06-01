function formatDateCustom(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0'); // Ensure 2-digit day

  return `${year}-${month}-${day}`;
}

function formatMinutesToHoursAndMinutes(minutes) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours === 0) {
    return `${remainingMinutes} phút`;
  } else if (remainingMinutes === 0) {
    return `${hours} giờ`;
  } else {
    return `${hours} giờ ${remainingMinutes} phút`;
  }
}

module.exports = {
  formatDateCustom,
  formatMinutesToHoursAndMinutes
}; 