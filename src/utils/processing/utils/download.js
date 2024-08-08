async function downloadFile(fileId, filePath) {
  try {
    const response = await openai.files.content(fileId);

    // Extract the binary data from the Response object
    const fileData = await response.arrayBuffer();

    // Convert the binary data to a Buffer
    const fileBuffer = Buffer.from(fileData);

    // Save the file to the specified location
    fs.writeFileSync(filePath, fileBuffer);

    console.log(`File downloaded and saved to ${filePath}`);
  } catch (error) {
    console.error('Error downloading file:', error);
  }
}

module.exports = { downloadFile };