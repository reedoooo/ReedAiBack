// Function to check if a URL points to an image (basic version)
function isImageUrl(url) {
  return url.match(/\.(jpeg|jpg|gif|png)$/) != null;
}

module.exports = {
  isImageUrl,
};