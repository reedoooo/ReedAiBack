import React, { useState } from 'react';

class PromptTemplate {
  constructor(name, baseTemplate, components) {
    this.name = name;
    this.baseTemplate = baseTemplate;
    this.components = components;
  }

  generatePrompt() {
    let prompt = this.baseTemplate;

    for (const [category, items] of Object.entries(this.components)) {
      prompt += `\n\n## ${category}`;
      for (const [key, value] of Object.entries(items)) {
        prompt += `\n- ${key}: ${value}`;
      }
    }

    return prompt;
  }

  toObject() {
    return {
      name: this.name,
      baseTemplate: this.baseTemplate,
      components: this.components,
    };
  }

  static fromObject(data) {
    return new PromptTemplate(data.name, data.baseTemplate, data.components);
  }
}

const PromptTemplateComponent = () => {
  const [generatedPrompt, setGeneratedPrompt] = useState('');

  const advancedPrompt = new PromptTemplate(
    'Advanced Completion Guidelines',
    'Generate a completion that adheres to the following comprehensive guidelines:',
    {
      'Content Components': {
        Context: 'Provide relevant background information',
        'Main Body': 'Develop a coherent and logical argument',
        Examples: 'Include illustrative examples where appropriate',
        Counterarguments: 'Address potential counterpoints',
        Conclusion: 'Summarize key points and provide closure',
      },
      'Style Guidelines': {
        Tone: 'Formal and authoritative',
        Language: 'Precise and technical',
        Complexity: 'Advanced, suitable for expert audience',
        'Figurative Language': 'Use analogies to explain complex concepts',
        'Sentence Structure': 'Vary between complex and simple for rhythm',
      },
      'State Management': {
        'Context Retention': 'Maintain consistent context throughout the response',
        'Information Tracking': 'Keep track of previously mentioned facts',
        Coherence: 'Ensure logical flow between paragraphs and sections',
        'Memory Utilization': 'Efficiently use available context window',
      },
      'Performance Optimization': {
        'Response Time': 'Optimize for quick generation without sacrificing quality',
        'Resource Usage': 'Minimize computational resources required',
        Scalability: 'Ensure prompt works well for various lengths of output',
        Caching: 'Implement intelligent caching for frequently used information',
      },
      'Output Format': {
        Structure: 'Use markdown for formatting',
        Sections: 'Clearly delineate sections with headers',
        Lists: 'Use bullet points for enumerations',
        'Code Blocks': 'Format code snippets in appropriate language-specific blocks',
        Tables: 'Use markdown tables for comparing items',
      },
      'Error Handling': {
        Ambiguity: 'Clarify ambiguous inputs before proceeding',
        'Incomplete Information': 'Request additional details if necessary',
        Contradictions: 'Highlight and resolve any contradictory requirements',
        Fallback: 'Provide general response if specific details are unavailable',
      },
      'Evaluation Criteria': {
        Accuracy: 'Ensure factual correctness and cite sources',
        Relevance: 'Stay on topic and address the main question',
        Completeness: 'Cover all aspects of the query comprehensively',
        Originality: 'Provide unique insights beyond common knowledge',
        'Ethical Considerations': 'Adhere to ethical guidelines and avoid harmful content',
      },
    }
  );

  const handleGeneratePrompt = () => {
    const prompt = advancedPrompt.generatePrompt();
    setGeneratedPrompt(prompt);
  };

  const handleSavePrompt = () => {
    const promptObject = advancedPrompt.toObject();
    // Here you would typically save the promptObject to your storage or state management system
    console.log('Saved prompt:', promptObject);
  };

  const handleLoadPrompt = () => {
    // Here you would typically load the promptObject from your storage or state management system
    const loadedPromptObject = {
      name: 'Advanced Completion Guidelines',
      baseTemplate: 'Generate a completion that adheres to the following comprehensive guidelines:',
      components: {
        /* ... */
      }, // The full components object would be here
    };
    const loadedPrompt = PromptTemplate.fromObject(loadedPromptObject);
    setGeneratedPrompt(loadedPrompt.generatePrompt());
  };

  return (
    <div>
      <h1>{advancedPrompt.name}</h1>
      <button onClick={handleGeneratePrompt}>Generate Prompt</button>
      <button onClick={handleSavePrompt}>Save Prompt</button>
      <button onClick={handleLoadPrompt}>Load Prompt</button>
      <pre>{generatedPrompt}</pre>
    </div>
  );
};

const advancedPromptTemplates = {
  COMPONENT_COMPLETION_GUIDELINES: JSON.stringify(advancedPrompt),
};

export default PromptTemplateComponent;
