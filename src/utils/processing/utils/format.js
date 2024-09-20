const { ESLint } = require('eslint');
const prettier = require('prettier');

async function lintAndFormatPrompt(prompt) {
  // Initialize ESLint
  const eslint = new ESLint({ fix: true });

  try {
    // Lint and fix the prompt
    const results = await eslint.lintText(prompt);
    const [{ output }] = results;

    // Use output if it exists, otherwise fallback to the original prompt
    const lintedPrompt = output || prompt;

    // Format with Prettier
    const formattedPrompt = prettier.format(lintedPrompt, {
      parser: 'babel',
      singleQuote: true,
      trailingComma: 'es5',
      printWidth: 100,
    });

    return formattedPrompt; // Return formatted string
  } catch (error) {
    console.error('Linting or formatting error:', error);
    return prompt; // Return the original prompt if any error occurs
  }
}

function formatCodeSnippet(code, parser = 'babel') {
  try {
    return prettier.format(code, { parser, semi: true, singleQuote: true });
  } catch (error) {
    console.error('Formatting error:', error);
    return code; // Return original code if formatting fails
  }
}

module.exports = { formatCodeSnippet, lintAndFormatPrompt };

// Usage
// const formattedCode = formatCodeSnippet(`
// function MyComponent({prop1,prop2}){
//   return(<div><h1>{prop1}</h1><p>{prop2}</p></div>)
// }
// `);
// console.log(formattedCode);
