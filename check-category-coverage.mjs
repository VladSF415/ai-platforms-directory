#!/usr/bin/env node
import { readFileSync } from 'fs';

const platforms = JSON.parse(readFileSync('platforms.json', 'utf-8'));

// Get all unique categories
const allCategories = [...new Set(platforms.map(p => p.category))].sort();

// Categories in the component groups
const mappedCategories = [
  // AI Infrastructure
  'machine-learning-platforms', 'llm-apis', 'devops-mlops', 'ai-agents-multi-agent', 'vector-databases-search', 'cloud-infrastructure',
  // Industry Solutions
  'enterprise-ai-platforms', 'healthcare-medical-ai', 'legal-ai-compliance', 'cybersecurity-ai', 'scientific-research-ai', 'education-learning-ai',
  // Creative & Media
  'image-generation-design', 'video-creation-editing', 'audio-music', 'voice-ai-speech', '3d-ar-vr',
  // Developer Tools
  'code-assistants-pair-programming', 'code-generation', 'testing-qa', 'low-code-no-code-ai', 'data-labeling-annotation', 'document-processing',
  // Data & Analytics
  'business-intelligence-visualization', 'big-data-engineering', 'text-analytics-nlp',
  // Computer Vision & NLP
  'computer-vision', 'text-analytics-nlp', 'seo-content-marketing', 'ai-writing-text', 'chatbots-conversational-ai',
  // Business Operations
  'workflow-automation', 'ai-assistants-copilots', 'sales-tools-intelligence', 'hr-talent-management', 'customer-service-ai', 'meeting-collaboration-tools', 'crm-customer-data',
  // Specialized
  'ecommerce-ai', 'social-media-management', 'research-knowledge-tools', 'gaming-entertainment-ai'
];

const uniqueMapped = [...new Set(mappedCategories)];
const unmapped = allCategories.filter(c => !uniqueMapped.includes(c));

console.log(`Total categories in data: ${allCategories.length}`);
console.log(`Unique mapped categories: ${uniqueMapped.length}`);
console.log(`Unmapped categories: ${unmapped.length}`);

if (unmapped.length > 0) {
  console.log('\n❌ Categories NOT in groups:');
  unmapped.forEach(cat => {
    const count = platforms.filter(p => p.category === cat).length;
    console.log(`  - ${cat} (${count} platforms)`);
  });
} else {
  console.log('\n✅ All categories are mapped!');
}

// Check for duplicates in mapped list
const duplicates = mappedCategories.filter((item, index) => mappedCategories.indexOf(item) !== index);
if (duplicates.length > 0) {
  console.log('\n⚠️  Duplicate mappings:');
  [...new Set(duplicates)].forEach(dup => {
    console.log(`  - ${dup} appears ${mappedCategories.filter(c => c === dup).length} times`);
  });
}
