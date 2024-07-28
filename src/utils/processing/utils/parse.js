/**
 * Converts a JSON array of messages to HTML content.
 * @param {Array} messages - Array of message objects.
 * @returns {string} - The HTML content as a string.
 */
function parseMessagesToHTML(messages) {
  return messages
    .map(message => {
      // Destructure message object
      const { role, content } = message;

      // Depending on the role, you can style the message differently or add additional logic.
      switch (role) {
        case 'system':
          return `<div class="system-message">${parseContent(content)}</div>`;
        case 'user':
          return `<div class="user-message">${parseContent(content)}</div>`;
        case 'assistant':
          return `<div class="assistant-message">${parseContent(content)}</div>`;
        default:
          return `<div class="unknown-message">${parseContent(content)}</div>`;
      }
    })
    .join(''); // Join all messages into a single HTML string
}

/**
 * Parses the content, extracting and formatting it as HTML.
 * @param {string} content - The content to parse.
 * @returns {string} - The HTML content as a string.
 */
function parseContent(content) {
  // Replace ST- and -EN markers
  let cleanedContent = content;

  // Handle special cases for code blocks
  cleanedContent = cleanedContent.replace(/\\n/g, '\n');
  cleanedContent = cleanedContent.replace(/\\\\/g, '\\');
  cleanedContent = cleanedContent.replace(/\\'/g, "'");
  cleanedContent = cleanedContent.replace(/\\"/g, '"');

  // Handle special cases for tables
  cleanedContent = cleanedContent.replace(/\|(.+)\|/g, (match, p1) => {
    const cells = p1.split('|').map(cell => cell.trim());
    const isHeader = cells.every(cell => cell.startsWith('---'));
    if (isHeader) {
      return '<tr>' + cells.map(() => '<th></th>').join('') + '</tr>';
    }
    return '<tr>' + cells.map(cell => `<td>${cell}</td>`).join('') + '</tr>';
  });
  cleanedContent = cleanedContent.replace(/<tr>(.+?)<\/tr>/g, '<table>$&</table>');

  // Handle special cases for headings
  cleanedContent = cleanedContent.replace(/^(#{1,6})\s(.+)$/gm, (match, hashes, text) => {
    const level = hashes.length;
    return `<h${level}>${text.trim()}</h${level}>`;
  });

  // Handle special cases for code blocks
  cleanedContent = cleanedContent.replace(/```(\w+)?\n([\s\S]+?)```/g, (match, language, code) => {
    return `<pre><code class="language-${language || ''}">${code.trim()}</code></pre>`;
  });

  // Handle special cases for lists
  cleanedContent = cleanedContent.replace(/^(\s*)-\s(.+)$/gm, '<li>$2</li>');
  cleanedContent = cleanedContent.replace(/^(\s*)\d+\.\s(.+)$/gm, '<li>$2</li>');
  cleanedContent = cleanedContent.replace(/<li>(.+?)<\/li>/g, '<ul>$&</ul>');

  // Handle special cases for blockquotes
  cleanedContent = cleanedContent.replace(/^>\s(.+)$/gm, '<blockquote>$1</blockquote>');

  // Handle special cases for images
  cleanedContent = cleanedContent.replace(/!\[(.+?)\]\((.+?)\)/g, '<img src="$2" alt="$1">');

  // Handle special cases for links
  cleanedContent = cleanedContent.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');

  // Handle special cases for bold text
  cleanedContent = cleanedContent.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // Handle special cases for paragraphs
  cleanedContent = cleanedContent.replace(/^(?!<[a-z]+>)(.+)$/gm, '<p>$1</p>');

  // Use a regular expression to match and replace custom markdown with HTML elements
  const formattedContent = cleanedContent
    .replace(/`type`: (.*)/g, '<strong>Type:</strong> $1')
    .replace(/`data`: (.*)/g, '<strong>Data:</strong> $1')
    .replace(/`metadata`: (.*)/g, '<strong>Metadata:</strong> $1')
    .replace(/`index`: (.*)/g, '<strong>Index:</strong> $1')
    .replace(/`content`: (.*)/g, '<strong>Content:</strong> $1')
    .replace(/`(href|alt|class)`/g, '$1')
    .replace(/`(img|pre|code|ul|ol|table|th|td|tr|a|strong|h1|h2|p|blockquote)`/g, '$1');

  // Convert new lines to <br> tags for better formatting
  return formattedContent.replace(/\n/g, '<br>');
}

const parseSections = sections => {
  return sections.map(section => {
    const { index, type, content } = section;
    return { index, type, content: parseContent(content) };
  });
};

module.exports = {
  parseMessagesToHTML,
  parseContent,
  parseSections,
};
