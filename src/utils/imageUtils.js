const fs = require('fs');
const path = require('path');

/**
 * Decode base64 string and save as image file
 * @param {string} base64String - The base64 encoded image string
 * @param {string} outputPath - The path where the image should be saved
 * @returns {string} - The path to the saved image
 */
const decodeBase64ToImage = (base64String, outputPath) => {
  try {
    // Remove data URL prefix if present (e.g., "data:image/jpeg;base64,")
    const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
    
    // Create buffer from base64 string
    const imageBuffer = Buffer.from(base64Data, 'base64');
    
    // Ensure directory exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Write buffer to file
    fs.writeFileSync(outputPath, imageBuffer);
    
    return outputPath;
  } catch (error) {
    console.error('Error decoding base64 image:', error);
    throw error;
  }
};

/**
 * Display employee images
 * @param {Object} employee - The employee object containing image fields
 * @param {string} outputDir - Directory to save the decoded images
 * @returns {Object} - Object containing paths to saved images
 */
const displayEmployeeImages = (employee, outputDir = 'public/images/employees') => {
  const images = {};
  
  if (employee.faceImage) {
    const faceImagePath = path.join(outputDir, `${employee.employeeId}_face.jpg`);
    images.faceImage = decodeBase64ToImage(employee.faceImage, faceImagePath);
  }
  
  if (employee.imageAvatar) {
    const avatarPath = path.join(outputDir, `${employee.employeeId}_avatar.jpg`);
    images.imageAvatar = decodeBase64ToImage(employee.imageAvatar, avatarPath);
  }
  
  if (employee.image34) {
    const image34Path = path.join(outputDir, `${employee.employeeId}_34.jpg`);
    images.image34 = decodeBase64ToImage(employee.image34, image34Path);
  }
  
  return images;
};

module.exports = {
  decodeBase64ToImage,
  displayEmployeeImages
}; 