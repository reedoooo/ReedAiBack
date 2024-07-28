const convertBlobToBase64 = async blob => {
  if (!blob) {
    throw new Error('No blob provided');
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

function getMediaTypeFromDataURL(dataURL) {
  const matches = dataURL.match(/^data:([A-Za-z-+\/]+);base64/);
  return matches ? matches[1] : null;
}

function getBase64FromDataURL(dataURL) {
  const matches = dataURL.match(/^data:[A-Za-z-+\/]+;base64,(.*)$/);
  return matches ? matches[1] : null;
}
const byteToImageURL = (mimeType, data) => {
  const b64 = `data:${mimeType};base64,${encode(data)}`;
  return b64;
};

const getFileExtension = (filename) => {
  const extension = filename.split('.').pop();
  return extension ? extension.toLowerCase() : '';
}


module.exports = {
  convertBlobToBase64,
  getMediaTypeFromDataURL,
  getBase64FromDataURL,
	byteToImageURL,
  getFileExtension,
};
