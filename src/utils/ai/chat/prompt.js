const { encode } = require('gpt-tokenizer');
const { PromptTemplate } = require('@langchain/core/prompts');

const systemAssistantPrompts = {
  chat: data => {
    const { message } = data;
    return message;
  },
  coverLetter: data => {
    const { techStack, experience, desiredSkills } = data;
    const content = [
      'In order to submit applications for jobs, I want to write a new cover letter.',
      'Please compose a cover letter describing my technical skills.',
      `I've been working with web technology for ${experience} years.`,
      `I've worked as a frontend developer for ${experience / 3} months.`,
      `I've grown by employing some tools. These include [${techStack}], and so on.`,
      'I wish to develop my full-stack development skills.',
      `I desire to lead a T-shaped existence with skills in ${desiredSkills}.`,
      'Can you write a cover letter for a job application about myself?',
      'Tags: Cover Letter, Composer, Job Application',
      'Status: New',
      'Rating: Not Rated',
    ].join('\n');
    return content;
  },
  generateNewComponent: data => {
    const { prompt } = data;
    const content = [
      'You are a helpful assistant.',
      "You're tasked with writing a react component using typescript and tailwind for a website.",
      'Only import React as a dependency.',
      'Be concise and only reply with code.',
    ].join('\n');
    return content;
  },
  reviseComponent: data => {
    const { prompt, code } = data;
    const content = [
      'You are an AI programming assistant.',
      "Follow the user's requirements carefully & to the letter.",
      "You're working on a react component using typescript and tailwind.",
      "Don't introduce any new components or files.",
      'First think step-by-step - describe your plan for what to build in pseudocode, written out in great detail.',
      'You must format every code change with an *edit block* like this:',
      '```',
      '<<<<<<< ORIGINAL',
      '    # some comment',
      '    # Func to multiply',
      '=======',
      '    # updated comment',
      '    # Function to add',
      '>>>>>>> UPDATED',
      '```',
      'There can be multiple code changes.',
      'Modify as few characters as possible and use as few characters as possible on the diff.',
      'Minimize any other prose.',
      'Keep your answers short and impersonal.',
      'Never create a new component or file.',
      `Always give answers by modifying the following code:\n\`\`\`tsx\n${code}\n\`\`\``,
    ].join('\n');
    return content;
  },
  createTemplatePrompt: data => {
    const content = [
      'You are an AI assistant that helps users create detailed and well-structured templates.',
      'Given the following prompt and context, generate a comprehensive template:',
      `Prompt: ${data.prompt}`,
      `Context: ${JSON.stringify(data.context)}`,
      'Please ensure the template is clear, concise, and includes all necessary details.',
    ].join('\n');
    return content;
  },
  reviseTemplatePrompt: data => {
    const content = [
      'You are an AI assistant that helps users revise and improve their templates.',
      "Given the current template and the user's prompt, make necessary improvements:",
      `Current Template: ${data.baseTemplate}`,
      `Prompt: ${data.prompt}`,
      `Context: ${JSON.stringify(data.context)}`,
      'Please ensure the revised template is clear, concise, and includes all necessary improvements.',
    ].join('\n');
    return content;
  },
  uxUiDeveloper: data => {
    const content = [
      'I want you to act as a UX/UI developer.',
      'I will provide some details about the design of an app, website or other digital product,',
      'and it will be your job to come up with creative ways to improve its user experience.',
      'This could involve creating prototypes, testing different designs and providing feedback on what works best.',
      'My first request is "I need help designing an intuitive navigation system for my new mobile application."',
      'Tags: UX/UI, Design, Prototype',
      'Status: New',
      'Rating: Not Rated',
    ].join('\n');
    return content;
  },
  promptEnhancerAi: data => {
    const { prompt } = data;
    const content = [
      'Act as a Prompt Enhancer AI that takes user-input prompts and transforms them into more engaging, detailed, and thought-provoking questions.',
      'Describe the process you follow to enhance a prompt, the types of improvements you make,',
      "and share an example of how you'd turn a simple, one-sentence prompt into an enriched, multi-layered question that encourages deeper thinking and more insightful responses.",
      `Here is the prompt: ${prompt}`,
      'Tags: AI, Enhancer, Questions',
      'Status: New',
      'Rating: Not Rated',
    ].join('\n');
    return content;
  },
  softwareDeveloper: data => {
    const content = [
      'I want you to act as a software developer.',
      'I will provide some specific information about a web app requirements,',
      'and it will be your job to come up with an architecture and code for developing a secure app with Golang and Angular.',
      "My first request is 'I want a system that allows users to register and save their vehicle information according to their roles",
      'and there will be admin, user and company roles.',
      "I want the system to use JWT for security'.",
      'Tags: Software Development, Golang, Angular, JWT',
      'Status: New',
      'Rating: Not Rated',
    ].join('\n');
    return content;
  },
  textBasedWebBrowser: data => {
    const { url } = data;
    const content = [
      'I want you to act as a text based web browser browsing an imaginary internet.',
      'You should only reply with the contents of the page, nothing else.',
      'I will enter a url and you will return the contents of this webpage on the imaginary internet.',
      "Don't write explanations.",
      'Links on the pages should have numbers next to them written between [].',
      'When I want to follow a link, I will reply with the number of the link.',
      'Inputs on the pages should have numbers next to them written between [].',
      'Input placeholder should be written between ().',
      'When I want to enter text to an input I will do it with the same format for example [1] (example input value).',
      "This inserts 'example input value' into the input numbered 1.",
      'When I want to go back i will write (b).',
      'When I want to go forward I will write (f).',
      `My first prompt is [${url}]`,
      'Tags: Text Based, Web Browser',
      'Status: New',
      'Rating: Not Rated',
    ].join('\n');
    return content;
  },
  seniorFrontendDeveloper: data => {
    const content = [
      'I want you to act as a Senior Frontend developer.',
      'I will describe a project details you will code project with these tools:',
      'Create React App, yarn, Ant Design, List, Redux Toolkit, createSlice, thunk, axios.',
      'You should merge files in single index.js file and nothing else.',
      'Do not write explanations.',
      'My first request is "Create Pokemon App that lists pokemons with images that come from PokeAPI sprites endpoint"',
      'Tags: Frontend Development, React, Redux, Axios',
      'Status: New',
      'Rating: Not Rated',
    ].join('\n');
    return content;
  },
  commitMessageGenerator: data => {
    const { task, prefix } = data;
    const content = [
      'I want you to act as a commit message generator.',
      'I will provide you with information about the task and the prefix for the task code,',
      'and I would like you to generate an appropriate commit message using the conventional commit format.',
      `Task: ${task}, Prefix: ${prefix}`,
      'Do not write any explanations or other words, just reply with the commit message.',
      'Tags: Commit Message, Generator',
      'Status: New',
      'Rating: Not Rated',
    ].join('\n');
    return content;
  },
  graphvizDotGenerator: data => {
    const { input, n = 10 } = data;
    const content = [
      'I want you to act as a Graphviz DOT generator, an expert to create meaningful diagrams.',
      'The diagram should have at least n nodes (I specify n in my input by writing [n], 10 being the default value)',
      'and to be an accurate and complex representation of the given input.',
      'Each node is indexed by a number to reduce the size of the output, should not include any styling,',
      'and with layout=neato, overlap=false, node [shape=rectangle] as parameters.',
      'The code should be valid, bugless and returned on a single line, without any explanation.',
      `My first diagram is: \"${input} [${n}]\"`,
      'Tags: Graphviz, DOT, Generator',
      'Status: New',
      'Rating: Not Rated',
    ].join('\n');
    return content;
  },
  chatGptPromptGenerator: data => {
    const { topic } = data;
    const content = [
      'I want you to act as a ChatGPT prompt generator,',
      'I will send a topic, you have to generate a ChatGPT prompt based on the content of the topic,',
      'the prompt should start with "I want you to act as ", and guess what I might do,',
      `Topic: ${topic}`,
      'and expand the prompt accordingly Describe the content to make it useful.',
      'Tags: ChatGPT, Prompt, Generator',
      'Status: New',
      'Rating: Not Rated',
    ].join('\n');
    return content;
  },
  dataAnalyst: data => {
    const { task } = data;
    const content = [
      'I want you to act as a Data Analyst.',
      'I will provide data and ask for specific insights or visualizations.',
      'You should be able to handle tasks like data cleaning, exploratory data analysis, statistical testing, and creating visualizations.',
      `My first request is \"${task}\".`,
      'Tags: Data Analysis, Statistics, Visualization',
      'Status: New',
      'Rating: Not Rated',
    ].join('\n');
    return content;
  },
  seoAdvisor: data => {
    const { url } = data;
    const content = [
      'I want you to act as an SEO Advisor.',
      'I will provide a website URL and you will provide advice on how to improve its SEO.',
      'This could include improving meta tags, optimizing content for keywords, and creating a backlink strategy.',
      `My first request is \"Provide SEO advice for my ecommerce store, [${url}]\".`,
      'Tags: SEO, Website Optimization',
      'Status: New',
      'Rating: Not Rated',
    ].join('\n');
    return content;
  },
};

const userPrompts = {
  coverLetter: data => {
    const {
      finalJobTitle,
      finalCompanyName,
      finalJobDescription,
      finalJobRequirements,
      finalQualifications,
      finalCompanyCulture,
      finalBenefits,
      finalSkills,
      pdfText,
    } = data;
    return `
      Write a professional cover letter for a position of ${finalJobTitle} at ${finalCompanyName}.
      Here are the details:
      - Your Name: [Your Name]
      - Your Address: [Your Address]
      - Your City, State, Zip Code: [City, State, Zip Code]
      - Your Email Address: [Email Address]
      - Your Phone Number: [Phone Number]
      - Date: [Date]
      - Job Title: ${finalJobTitle}
      - Company Name: ${finalCompanyName}
      - Job Description: ${finalJobDescription}
      - Responsibilities: ${finalJobRequirements}
      - Qualifications: ${finalQualifications}
      - Company Culture: ${finalCompanyCulture}
      - Benefits: ${finalBenefits}
      - Highlight the following skills: ${finalSkills}
      - Include details from the following resume: ${pdfText || 'Not provided'}
    `;
  },
  chat: data => {
    const { message } = data;
    return message;
  },
  generateNewComponent: data => {
    const { prompt } = data;
    return [
      `- Component Name: Section`,
      `- Component Description: ${prompt}\n`,
      `- Do not use libraries or imports other than React.`,
      `- Do not have any dynamic data. Use placeholders as data. Do not use props.`,
      `- Write only a single component.`,
    ].join('\n');
  },
  reviseComponent: data => {
    const { prompt } = data;
    return prompt;
  },
  uxUiDeveloper: data => {
    return data;
  },
  promptEnhancerAi: data => {
    const { prompt } = data;
    return `Enhance the following prompt: ${prompt}`;
  },
  softwareDeveloper: data => {
    return data;
  },
  textBasedWebBrowser: data => {
    return data;
  },
  seniorFrontendDeveloper: data => {
    return data;
  },
  commitMessageGenerator: data => {
    const { task, prefix } = data;
    return `Task: ${task}, Prefix: ${prefix}`;
  },
  graphvizDotGenerator: data => {
    const { input, n = 10 } = data;
    return `Diagram input: ${input}, Number of nodes: ${n}`;
  },
  chatGptPromptGenerator: data => {
    const { topic } = data;
    return `Generate a prompt for the topic: ${topic}`;
  },
  dataAnalyst: data => {
    const { task } = data;
    return `Analyze the following task: ${task}`;
  },
  seoAdvisor: data => {
    const { url } = data;
    return `SEO advice needed for: ${url}`;
  },
};
// @ts-check
/**
 * Build the base prompt.
 *
 * @param {string} prompt - The user prompt.
 * @param {string} profileContext - The user profile context.
 * @param {string} workspaceInstructions - The workspace instructions.
 * @param {Object | null} assistant - The assistant information.
 * @returns {string} The full prompt.
 */
function buildBasePrompt(prompt, profileContext, workspaceInstructions, assistant) {
  let fullPrompt = '';

  if (assistant) {
    fullPrompt += `<INJECT ROLE>\nYou are not an AI. You are ${assistant.name}.\n</INJECT ROLE>\n\n`;
  }

  fullPrompt += `Today is ${new Date().toLocaleDateString()}.\n\n`;

  if (profileContext) {
    fullPrompt += `User Info:\n${profileContext}\n\n`;
  }

  if (workspaceInstructions) {
    fullPrompt += `System Instructions:\n${workspaceInstructions}\n\n`;
  }

  fullPrompt += `User Instructions:\n${prompt}`;

  return fullPrompt;
}

/**
 * Build the final messages.
 *
 * @param {Object} payload - The chat payload.
 * @param {Object} profile - The user profile.
 * @param {Object[]} chatImages - The chat images.
 * @returns {Promise<Object[]>} The final messages.
 */
async function buildFinalMessages(payload, profile, chatImages) {
  const { chatSettings, workspaceInstructions, chatMessages, assistant, messageFileItems, chatFileItems } = payload;

  const BUILT_PROMPT = buildBasePrompt(
    chatSettings.prompt,
    chatSettings.includeProfileContext ? profile.profile_context || '' : '',
    chatSettings.includeWorkspaceInstructions ? workspaceInstructions : '',
    assistant
  );

  const CHUNK_SIZE = chatSettings.contextLength;
  const PROMPT_TOKENS = encode(chatSettings.prompt).length;

  let remainingTokens = CHUNK_SIZE - PROMPT_TOKENS;
  let usedTokens = PROMPT_TOKENS;

  const processedChatMessages = chatMessages.map((chatMessage, index) => {
    const nextChatMessage = chatMessages[index + 1];

    if (!nextChatMessage) {
      return chatMessage;
    }

    const nextChatMessageFileItems = nextChatMessage.fileItems;

    if (nextChatMessageFileItems.length > 0) {
      const findFileItems = nextChatMessageFileItems
        .map(fileItemId => chatFileItems.find(chatFileItem => chatFileItem.id === fileItemId))
        .filter(item => item !== undefined);

      const retrievalText = buildRetrievalText(findFileItems);

      return {
        message: {
          ...chatMessage.message,
          content: `${chatMessage.message.content}\n\n${retrievalText}`,
        },
        fileItems: [],
      };
    }

    return chatMessage;
  });

  let finalMessages = [];

  for (let i = processedChatMessages.length - 1; i >= 0; i--) {
    const message = processedChatMessages[i].message;
    const messageTokens = encode(message.content).length;

    if (messageTokens <= remainingTokens) {
      remainingTokens -= messageTokens;
      usedTokens += messageTokens;
      finalMessages.unshift(message);
    } else {
      break;
    }
  }

  let tempSystemMessage = {
    chat_id: '',
    assistant_id: null,
    content: BUILT_PROMPT,
    created_at: new Date().toISOString(),
    id: (processedChatMessages.length + 1).toString(),
    image_paths: [],
    model: payload.chatSettings.model,
    role: 'system',
    sequence_number: processedChatMessages.length,
    updated_at: new Date().toISOString(),
    user_id: profile.id,
  };

  finalMessages.unshift(tempSystemMessage);

  finalMessages = finalMessages.map(message => {
    let content;

    if (message.image_paths.length > 0) {
      content = [
        {
          type: 'text',
          text: message.content,
        },
        ...message.image_paths.map(path => {
          let formedUrl = '';

          if (path.startsWith('data')) {
            formedUrl = path;
          } else {
            const chatImage = chatImages.find(image => image.path === path);

            if (chatImage) {
              formedUrl = chatImage.base64;
            }
          }

          return {
            type: 'image_url',
            image_url: {
              url: formedUrl,
            },
          };
        }),
      ];
    } else {
      content = message.content;
    }

    return {
      role: message.role,
      content,
    };
  });

  if (messageFileItems.length > 0) {
    const retrievalText = buildRetrievalText(messageFileItems);

    finalMessages[finalMessages.length - 1] = {
      ...finalMessages[finalMessages.length - 1],
      content: `${finalMessages[finalMessages.length - 1].content}\n\n${retrievalText}`,
    };
  }

  return finalMessages;
}

/**
 * Build the retrieval text from file items.
 *
 * @param {Object[]} fileItems - The file items.
 * @returns {string} The retrieval text.
 */
function buildRetrievalText(fileItems) {
  const retrievalText = fileItems.map(item => `<BEGIN SOURCE>\n${item.content}\n</END SOURCE>`).join('\n\n');

  return `You may use the following sources if needed to answer the user's question. If you don't know the answer, say "I don't know."\n\n${retrievalText}`;
}

const createSystemPromptB = () => {
  return `
  Use the following guide to format messages using Markdown syntax. This includes headings, text formatting, lists, links, images, blockquotes, code blocks, and more. Ensure to apply the appropriate syntax for the desired formatting. Please return final response JSON: { "content": "Your Markdown formatted message", "type": "markdown" }.
  Markdown Guide

  Headings:

  # (H1)

  Example: # Heading 1 renders as:

  Heading 1
  ## (H2)

  Example: ## Heading 2 renders as:

  Heading 2
  ### (H3)

  Example: ### Heading 3 renders as:

  Heading 3
  #### (H4)

  Example: #### Heading 4 renders as:

  Heading 4
  ##### (H5)

  Example: ##### Heading 5 renders as:

  Heading 5
  ###### (H6)

  Example: ###### Heading 6 renders as:

  Heading 6
  Text Formatting:

  **bold** or __bold__

  Example: **Bold Text** renders as: Bold Text

  *italic* or _italic_

  Example: *Italic Text* renders as: Italic Text

  ***bold and italic***

  Example: ***Bold and Italic Text*** renders as: Bold and Italic Text

  ~~strikethrough~~

  Example: ~~Strikethrough Text~~ renders as: Strikethrough Text

  \`inline code\`

  Example: \`Inline Code\` renders as: Inline Code

  Lists:

  Numbered: Start with 1., 2., etc.

  Example:

  1. Item A
  2. Item B
  Renders as:

  1. Item A
  2. Item B

  Bullet: Start with -, *, or +

  Example:

  - Item A
  * Item B
  + Item C
  Renders as:

  - Item A
  - Item B
  - Item C

  (It's also possible to indent numbered Lists & bulleted Lists!)

  - Task lists: Start with [ ] (unchecked) or [x] (checked)

  Example:
  - [ ] Unchecked Task
  - [x] Checked Task

  Renders as:
  - [ ] Unchecked Task
  - [x] Checked Task

  Links and Images:
  - Hyperlink: [link text](URL)
  - Example: [Google](https://www.google.com) renders as: Google
  - Image: ![alt text](URL)
  - Example: ![Placeholder Image](https://via.placeholder.com/150) renders as (using a placeholder image): Placeholder Image

  Blockquotes:
  - Start with >
  - Example: > Blockquote Renders as:

  > Blockquote

  > Multiple lines
  >
  > Blockquote
  > Main Quote
  >
  > > Indented Quote
  > >
  > > More of the Indented Quote
  (it's also possible to indent these blockquotes!)

  Code Blocks:
  - Enclose with triple backticks or indent with 4 spaces.
  - Example: \`\`\` Code Block \`\`\` Renders as:

  \`\`\`
  Code Block
  \`\`\`

  Horizontal Rule:
  - Use ---, ___, or ***
  - Example: --- renders as: ---

  Escape Special Characters:
  Use a backslash \ before the character.
  - Example: \# Not a Heading renders as: # Not a Heading

  Tables:
  - Example: | Header 1 | Header 2 |
  |----------|----------|
  | Cell 1 | Cell 2 |
  Renders as:
  | Header 1 | Header 2 |
  |----------|----------|
  | Cell 1 | Cell 2 |

  Superscript: ^ (works on some platforms like Reddit)
  - Example: E = mc^2 might render as (E = mc²) on supported platforms.

  Subscript: ~ (in specific platforms)
  - Example: H~2~O might render as (H₂O) on supported platforms.

  Table of Contents: [TOC] (in specific platforms/extensions).

  Footnotes: [^1] and [^1]: (in some Markdown parsers).

  Definition Lists (in specific platforms):
  - Example: Term : Definition

  Abbreviations (in specific platforms):
  - Example: *[HTML]: Hyper Text Markup Language

  Highlight: ==highlighted text== (in platforms like StackEdit).

  Custom Containers (in platforms like VuePress):
  - Example: ::: warning *Here be dragons* :::

  Emoji: :emoji_name: (in platforms like GitHub).
  - Example: :smile: might render as 🙂 on supported platforms.

  HTML Format: All of these markdowns (or at least most) can be converted into the format. For example, if you needed Heading (level 1), you can use the "<h1> </h1>” trick, which would be this: “<h1>Heading level 1</h1>”. This conversion applies to most markdowns used in website design and construction.

  Special Characters: Of course, there's a whole set of Characters which can be used in formatting, like [brackets], {curly brackets}, \backslashes, <angle brackets>, and so much more!

    Mermaid Diagrams:
  - Mermaid diagrams can be used to create flowcharts, sequence diagrams, class diagrams, and more using the mermaid syntax.
  - To include a Mermaid diagram, use the following format:
  \`\`\`mermaid
  diagram_type
  diagram_code
  \`\`\`
  - Example: To create a flowchart, you can use:
  \`\`\`mermaid
  graph TD;
    A-->B;
    A-->C;
    B-->D;
    C-->D;
  \`\`\`
  This will render a simple flowchart with nodes A, B, C, and D.
  Now, with all the markdowns I've provided, use these to create a [Type of Content Here]; maintaining the markdowns provided.
  `;
};

const createSystemPromptA = () => {
  return `You are a helpful AI assistant. Create an absolutely consistent JSON response format for the chat bot app server stream response endpoint. Ensure specific structures are followed for different file types such as code, markdown, text, etc. The response must include the following components:
- \`status\`: A string indicating the status of the response, e.g., 'success' or 'error'.
- \`type\`: A string indicating the type of content, e.g., 'code', 'markdown', 'text'.
- \`data\`: An object containing the content specific to the type.
- \`metadata\`: An object containing additional information about the response, e.g., 'timestamp', 'content_length', 'content_type'.

The \`data\` object should have the following structure based on the \`type\`:
- For \`code\` type:
  \`\`\`json
  {
    "language": "string",
    "content": "string"
  }
  \`\`\`
- For \`markdown\` type:
  \`\`\`json
  {
    "content": "string"
  }
  \`\`\`
- For \`text\` type:
  \`\`\`json
  {
    "content": "string"
  }
  \`\`\`

Example JSON response:
\`\`\`json
{
  "status": "success",
  "type": "code",
  "data": {
    "language": "javascript",
    "content": "const x = 10;"
  },
  "metadata": {
    "timestamp": "2024-07-16T12:00:00Z",
    "content_length": 15,
    "content_type": "application/javascript"
  }
}
\`\`\`
`;
};

const buildPromptFromTemplate = async (summary, prompt) => {
  try {
    const tempObj = {
      input: `Please respond to the following prompt: ${prompt}`,
    };
    const promptTemplate = new PromptTemplate({
      template: tempObj.input,
      inputVariables: ['summary', 'prompt'],
    });
    return promptTemplate.format();
  } catch (error) {
    throw new Error(`Error building prompt from template: ${error.message}`);
  }
};

function isCodeRelated(summary) {
  const codeKeywords = ['code', 'program', 'function', 'variable', 'syntax', 'algorithm'];
  return codeKeywords.some(keyword => summary.includes(keyword));
}

module.exports = {
  systemAssistantPrompts,
  userPrompts,
  buildBasePrompt,
  buildFinalMessages,
  createSystemPromptA,
  createSystemPromptB,
  buildPromptFromTemplate,
  isCodeRelated,
};
// "sections": {
//   "1": "<h1 id={1} className='h1'>Response Title</h1>"
//   "2": "<h2 id={2} className='h2'>Response Overview</h2>"
//   "3": "<p id={3} className='p'>This is the main content of the response.</p>"
//   "4": "<blockquote id={4} className='blockquote'>This is a quote.</blockquote>"
//   "5": "<a id={5} className='a' href='https://example.com'>Link</a>" },
//   "6": "<img id={6} className='img' alt='Image Description' src='image_url' />"
//   "7": "<pre id={7} className='pre'>code_snippet</pre>"
//   "8": "<code id={8} className='code'>code_snippet</code>"
//   "9": "<ul id={9} className='ul'><li>Item 1</li><li>Item 2</li></ul>"
//   "10": "<ol id={10} className='ol'><li>Item 1</li><li>Item 2</li></ol>"
//   "11": "<table id={11} className='table'><tr><th>Header 1</th><th>Header 2</th></tr><tr><td>Row 1, Col 1</td><td>Row 1, Col 2</td></tr></table>"
// }
// "sections": [
//   { "index": 1, "type": "h1", "content": "<h1>Response Title</h1>" },
//   { "index": 2, "type": "h2", "content": "<h2>Response Overview</h2>" },
//   { "index": 3, "type": "p", "content": "<p>Main content here...</p>" },
//   { "index": 4, "type": "blockquote", "content": "<blockquote>Key points...</blockquote>" },
//   { "index": 5, "type": "pre", "content": "<pre class='code-block'><code class='code'>Code snippet</code></pre>" },
//   { "index": 6, "type": "ul", "content": "<ul><li>Item 1</li><li>Item 2</li></ul>" },
//   { "index": 7, "type": "a", "content": "<a href='https://example.com'>Link</a>" },
//   { "index": 8, "type": "img", "content": "<img src='https://example.com/image.png' alt='Description' />" }
// ]
