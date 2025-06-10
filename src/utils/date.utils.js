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
function calculateAverageTime(times) {
  // Chuyển đổi giờ và phút của từng mốc thời gian thành tổng số phút
  const totalMinutes = times.reduce((total, time) => {
      const date = new Date(time);
      const hours = date.getUTCHours(); // Giờ (UTC)
      const minutes = date.getUTCMinutes(); // Phút (UTC)
      return total + (hours * 60 + minutes);
  }, 0);

  // Tính trung bình số phút
  const averageMinutes = totalMinutes / times.length;

  // Chuyển trung bình phút thành giờ và phút
  const averageHours = Math.floor(averageMinutes / 60);
  const remainingMinutes = Math.round(averageMinutes % 60);

  return { hours: averageHours, minutes: remainingMinutes };
}
function timeDifferenceISO(startISO, endISO) {
  // Chuyển đổi dấu thời gian thành đối tượng Date
  const startDate = new Date(startISO);
  const endDate = new Date(endISO);

  // Tính toán hiệu số thời gian (mili giây)
  const differenceInMilliseconds = endDate - startDate;

  // Chuyển đổi mili giây thành phút
  const differenceInMinutes = Math.floor(differenceInMilliseconds / (1000 * 60));

  // Chuyển đổi phút thành giờ và phút
  const hours = Math.floor(differenceInMinutes / 60);
  const minutes = differenceInMinutes % 60;

  return { hours, minutes };
}
const getRelativeTime = (date) => {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return "Không xác định"
  }
  
  const now = new Date()
  const diffInSeconds = Math.floor((now - date) / 1000)

  if (diffInSeconds < 60) {
    return `${diffInSeconds} giây trước`
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes} phút trước`
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  return `${diffInHours} giờ trước`
}

module.exports = {
  formatDateCustom,
  formatMinutesToHoursAndMinutes,
  calculateAverageTime,
  timeDifferenceISO,
  getRelativeTime
}; 