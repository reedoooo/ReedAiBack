const axios = require('axios');
require('dotenv').config();
const threadByUser = {}; // Store thread IDs by user

async function FetchFrameworkDocumentation(framework) {
  const frameworkDocs = {
    MUI: 'https://mui.com/components/',
    CHAKRA_UI: 'https://chakra-ui.com/docs/getting-started',
    REACT_BOOTSTRAP: 'https://react-bootstrap.github.io/',
    TAILWIND: 'https://tailwindcss.com/docs',
    RADIX_UI: 'https://www.radix-ui.com/primitives/docs',
    SHADCN: 'https://ui.shadcn.com/docs',
  };

  const url = frameworkDocs[framework];
  if (!url) {
    throw new Error('Unsupported framework');
  }
  const response = await fetch(url);
  const documentation = await response.text();

  return documentation;
}

async function fetchSearchResults(query) {
  let data = JSON.stringify({
    q: query,
  });
  const config = {
    method: 'post',
    url: 'https://google.serper.dev/search',
    headers: {
      'X-API-KEY': process.env.GOOGLE_SERPER_API_KEY,
      'Content-Type': 'application/json',
    },
    data: data,
  };

  try {
    const response = await axios(config);
    const results = response.data;
    // Filter for LinkedIn URLs
    const linkedInUrls = results.organic.filter(res => res.link.includes('linkedin.com'));
    // Scrape each LinkedIn URL
    for (const result of linkedInUrls) {
      // const scrapedData = await scrapeLinkedIn(result.link);
      const scrapedData = {
        scrapedContent: 'Not available', // Placeholder value
      };
      result['scrapedContent'] = scrapedData;
    }
    return results;
  } catch (error) {
    console.error(`Error: ${error}`);
    throw error;
  }
}

async function analyzeImagesInText(text) {
  const imageUrls = extractUrls(text).filter(isImageUrl);
  let imageAnalysisResults = [];

  for (const url of imageUrls) {
    try {
      const analysisResult = await analyzeImageWithVisionAPI(url);
      imageAnalysisResults.push({ url, analysis: analysisResult });
    } catch (error) {
      console.error('Error analyzing image:', error);
    }
  }

  return imageAnalysisResults;
}

async function checkStatusAndPrintMessages(threadId, runId, intervalId) {
  let runStatus = await openai.beta.threads.runs.retrieve(threadId, runId);

  if (runStatus.status === 'completed' || runStatus.status === 'failed') {
    let messages = await openai.beta.threads.messages.list(threadId);
    messages.data.forEach(msg => {
      const role = msg.role;
      const content = msg.content[0].text.value;
      console.log(`${role.charAt(0).toUpperCase() + role.slice(1)}: ${content}`);
    });
    clearInterval(intervalId);
  } else if (runStatus.status === 'requires_action') {
    // Handle required actions
    const requiredActions = runStatus.required_action.submit_tool_outputs.tool_calls;
    let toolsOutput = [];

    for (const action of requiredActions) {
      if (action.function.name === 'fetchSearchResults') {
        const functionArguments = JSON.parse(action.function.arguments);
        const output = await fetchSearchResults(functionArguments.query);
        toolsOutput.push({
          tool_call_id: action.id,
          output: JSON.stringify(output),
        });
      }
    }

    await openai.beta.threads.runs.submitToolOutputs(threadId, runId, { tool_outputs: toolsOutput });
  } else {
    console.log('Run is not completed yet.');
  }
}

async function analyzeImageWithVisionAPI(url) {
  // Implement the logic to analyze the image using OpenAI's Vision API
  // Placeholder function logic
  return { description: 'Image analysis result' };
}

module.exports = {
  fetchSearchResults,
  analyzeImagesInText,
  checkStatusAndPrintMessages,
  analyzeImageWithVisionAPI,
  FetchFrameworkDocumentation,
  tools,
};
// async function scrapeLinkedIn(url) {
//   const browser = await puppeteer.launch();
//   const page = await browser.newPage();
//   await page.goto(url, { waitUntil: 'networkidle2' });
//   // Implement scraping logic specific to LinkedIn pages
//   const data = await page.evaluate(() => {
//     // Example: Scrape profile details
//     return document.body.innerText; // or more specific data extraction
//   });
//   await browser.close();
//   return data;
// }
// app.post("/chat", async (req, res) => {
//   const assistantIdToUse = "asst_swKHIz2VerOTdps3oX6bJhqi"; // Replace with your assistant ID
//   const userId = req.body.userId; // Include the user ID in the request
//   const assistantId = assistantIdToUse;

//   // Create a new thread if it's the user's first message
//   if (!threadByUser[userId]) {
//     try {
//       const myThread = await openai.beta.threads.create();
//       console.log("New thread created with ID: ", myThread.id);
//       threadByUser[userId] = myThread.id; // Store the thread ID for this user
//     } catch (error) {
//       console.error("Error creating thread:", error);
//       res.status(500).json({ error: "Internal server error" });
//       return;
//     }
//   }

//   const userMessage = req.body.message;

//   // Add a Message to the Thread
//   try {
//     const myThreadMessage = await openai.beta.threads.messages.create(
//       threadByUser[userId], // Use the stored thread ID for this user
//       {
//         role: "user",
//         content: userMessage,
//         file_ids: uploadedFileIds, // Include file_ids inside the message object
//       }
//     );
//     console.log("Message object: ", myThreadMessage);

//     // Run the Assistant
//     const myRun = await openai.beta.threads.runs.create(
//       threadByUser[userId], // Use the stored thread ID for this user
//       {
//         assistant_id: assistantIdToUse,
//         instructions: 'You are an AI Private Investigator tasked with gathering information on a specific object thing or person. Your mission is to collect comprehensive details including but not limited to the followingObject/Thing/Person Clearly identify the object thing or person you are investigating.Background Research and provide background information on the subject. This could include their history associations and any relevant context.Contact Information If applicable find and report any available contact information such as email addresses phone numbers or social media profiles.Physical Description Describe the physical appearance of the subject including any distinguishing features.Location Determine the current or last-known location of the subject.Associations Investigate and document any known associations or relationships the subject has with other individuals or entities.Legal Information If relevant uncover any legal records including criminal records lawsuits or court proceedings.Online Presence Search for and report any online presence or digital footprint including websites social media activity and online publications.Financial Information If applicable gather information on the financial status including income assets and liabilities.Additional Information Collect any other pertinent information that may aid in the investigation.Your goal is to compile a comprehensive dossier by utilizing your investigative skills and available resources. Ensure accuracy and thoroughness in your findings.Looking for email,phone number,images etc. Please Dont include obituary results',
//         tools: tools,
//         // Include the file IDs in the request
//       }
//     );
//     console.log("Run object: ", myRun);

//     // Check and print messages
//     const intervalId = setInterval(async () => {
//       try {
//         const runStatus = await openai.beta.threads.runs.retrieve(
//           threadByUser[userId],
//           myRun.id
//         );

//         if (runStatus.status === "completed" || runStatus.status === "failed") {
//           const messages = await openai.beta.threads.messages.list(
//             threadByUser[userId]
//           );

//           messages.data.forEach(async (msg) => {
//             const contentType = msg.content[0].type;

//             if (contentType === "text") {
//                 // Check if there are annotations and if the first annotation is a file path
//                 const annotations = msg.content[0].text.annotations;
//                 if (annotations && annotations.length > 0 && annotations[0].type === 'file_path') {
//                     const fileAnnotation = annotations[0];
//                     console.log("File path annotation:", fileAnnotation);

//                     // If there's a file_id, handle the file download
//                     if (fileAnnotation.file_path && fileAnnotation.file_path.file_id) {
//                         const fileId = fileAnnotation.file_path.file_id;
//                         const filePath = `./downloads/${fileId}`; // You may need to determine the correct file extension

//                         // Download the file using the fileId and save it to the specified path
//                         await downloadFile(fileId, filePath);
//                     }
//                 } else {
//                     // Handle normal text content
//                     const textContent = msg.content[0].text.value;
//                     console.log("Text content:", textContent);
//                 }
//             } else if (contentType === "image_file") {
//                 const fileId = msg.content[0].image_file.file_id;
//                 console.log("Image file ID:", fileId);

//                 // Define the file download path on your server
//                 const filePath = `./downloads/${fileId}.png`; // Change the extension based on the file type

//                 // Download the file using the fileId and save it to the specified path
//                 await downloadFile(fileId, filePath);
//             }
//         });

//           clearInterval(intervalId);
//   console.log(messages.data[0].content[0].type.file_id)
//           // Extract the bot's latest message
//           if (messages.data[0].content[0].type === "text") {
//             const latestBotMessage = messages.data[0].content[0].text.value;
//             res.json({ message: latestBotMessage });
//           } else if (messages.data[0].content[0].type === "image_file") {
//             const imageFileId = messages.data[0].content[0].image_file.file_id;
//             // You may need to send a URL or some identifier to the front end
//             res.json({ imageFileId: imageFileId });
//           }

//           // Send the bot's latest message as a JSON response to the front end

//         } else if (runStatus.status === "requires_action") {
//           // Handle required actions
//           const requiredActions =
//             runStatus.required_action.submit_tool_outputs.tool_calls;
//           let toolsOutput = [];

//           for (const action of requiredActions) {
//             let output;

//             if (action.function.name === "fetchSearchResults") {
//               const functionArguments = JSON.parse(action.function.arguments);
//               output = await fetchSearchResults(functionArguments.query);
//             } else if (action.function.name === "analyzeImage") {
//               const functionArguments = JSON.parse(action.function.arguments);
//               output = await analyzeImage(functionArguments.imageUrl);
//             }
//             // Add more 'else if' statements here for additional tools

//             if (output) {
//               toolsOutput.push({
//                 tool_call_id: action.id,
//                 output: JSON.stringify(output)
//               });
//             }
//           }

//           await openai.beta.threads.runs.submitToolOutputs(
//             threadByUser[userId],
//             myRun.id,
//             { tool_outputs: toolsOutput }
//           );
//         } else {
//           console.log("Run is not completed yet.");
//         }
//       } catch (error) {
//         console.error("Error in interval:", error);
//       }
//     }, 5000);
//   } catch (error) {
//     console.error("Error in /chat endpoint:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
//   });

// app.post('/upload', upload.single('file'), async (req, res) => {
//   if (!req.file) {
//     return res.status(400).send('No file uploaded.');
//   }

//   try {
//     const fileStream = fs.createReadStream(req.file.path);

//     // Upload the file to OpenAI
//     const openaiFile = await openai.files.create({
//       file: fileStream,
//       purpose: 'assistants', // or 'assistants' depending on your use case
//     });

//     // Store the uploaded file ID for later use
//     uploadedFileIds.push(openaiFile.id);

//     res.json({ message: 'File uploaded successfully', fileId: openaiFile.id });
//     console.log(fileIds)
//     console.log("test" + uploadedFileIds)
//   } catch (error) {
//     console.error('Error uploading file to OpenAI:', error);
//     res.status(500).send('Error processing file.');
//   } finally {
//     fs.unlinkSync(req.file.path); // Clean up the local file
//   }
// });
