const prettier = require('prettier');

function formatCodeSnippet(code, parser = 'babel') {
  try {
    return prettier.format(code, { parser, semi: true, singleQuote: true });
  } catch (error) {
    console.error('Formatting error:', error);
    return code; // Return original code if formatting fails
  }
}

module.exports = { formatCodeSnippet };

// Usage
// const formattedCode = formatCodeSnippet(`
// function MyComponent({prop1,prop2}){
//   return(<div><h1>{prop1}</h1><p>{prop2}</p></div>)
// }
// `);
// console.log(formattedCode);
