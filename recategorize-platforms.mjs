import fs from 'fs';
import path from 'path';

// Load data
const platformsPath = './platforms.json';
const mappingPath = './category-mapping.json';

const platforms = JSON.parse(fs.readFileSync(platformsPath, 'utf8'));
const { mapping, megaCategories } = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));

// Statistics tracking
const stats = {
  totalPlatforms: platforms.length,
  recategorized: 0,
  unchanged: 0,
  manualReview: [],
  categoryDistribution: {},
  megaCategoryDistribution: {},
  oldToNewMapping: {},
  platformChanges: []
};

// Initialize category distribution
Object.values(megaCategories).forEach(megaCat => {
  stats.megaCategoryDistribution[megaCat] = 0;
});

Object.keys(megaCategories).forEach(cat => {
  stats.categoryDistribution[cat] = 0;
});

// Helper function to determine best category based on multiple signals
function determineBestCategory(platform) {
  const signals = [];

  // Signal 1: Current primary category
  if (platform.category && mapping[platform.category]) {
    signals.push({ category: mapping[platform.category], weight: 10, source: 'primary_category' });
  }

  // Signal 2: Categories array
  if (platform.categories && Array.isArray(platform.categories)) {
    platform.categories.forEach(cat => {
      if (mapping[cat]) {
        signals.push({ category: mapping[cat], weight: 5, source: 'categories_array' });
      }
    });
  }

  // Signal 3: Subcategories
  if (platform.subcategories && Array.isArray(platform.subcategories)) {
    platform.subcategories.forEach(subcat => {
      const subcatLower = subcat.toLowerCase().replace(/\s+/g, '-');
      if (mapping[subcatLower]) {
        signals.push({ category: mapping[subcatLower], weight: 3, source: 'subcategories' });
      }
    });
  }

  // Signal 4: Tags - semantic matching
  if (platform.tags && Array.isArray(platform.tags)) {
    platform.tags.forEach(tag => {
      if (mapping[tag]) {
        signals.push({ category: mapping[tag], weight: 2, source: 'tags' });
      }
    });
  }

  // Signal 5: Description analysis for key terms
  if (platform.description) {
    const desc = platform.description.toLowerCase();

    // Healthcare/Medical
    if (desc.match(/\b(medical|healthcare|clinical|diagnostic|drug discovery|radiology|pathology|patient)\b/)) {
      signals.push({ category: 'healthcare-medical-ai', weight: 4, source: 'description_medical' });
    }

    // Code/Development
    if (desc.match(/\b(code generation|programming|developer|ide|coding|software development)\b/)) {
      signals.push({ category: 'code-generation', weight: 4, source: 'description_code' });
    }
    if (desc.match(/\b(pair programming|code assistant|autocomplete|copilot)\b/)) {
      signals.push({ category: 'code-assistants-pair-programming', weight: 4, source: 'description_code_assistant' });
    }

    // Writing/Content
    if (desc.match(/\b(writing|copywriting|content creation|blog|article|text generation)\b/)) {
      signals.push({ category: 'ai-writing-text', weight: 4, source: 'description_writing' });
    }

    // Image generation
    if (desc.match(/\b(image generation|text-to-image|ai art|visual design|graphic design)\b/)) {
      signals.push({ category: 'image-generation-design', weight: 4, source: 'description_image' });
    }

    // Video
    if (desc.match(/\b(video generation|video editing|video creation|video production)\b/)) {
      signals.push({ category: 'video-creation-editing', weight: 4, source: 'description_video' });
    }

    // Audio/Music
    if (desc.match(/\b(audio generation|music|voice cloning|text-to-speech|speech recognition)\b/)) {
      if (desc.match(/\b(speech recognition|speech-to-text|text-to-speech|voice assistant)\b/)) {
        signals.push({ category: 'voice-ai-speech', weight: 4, source: 'description_speech' });
      } else {
        signals.push({ category: 'audio-music', weight: 4, source: 'description_audio' });
      }
    }

    // 3D/AR/VR
    if (desc.match(/\b(3d|photogrammetry|ar|vr|augmented reality|virtual reality|3d reconstruction)\b/)) {
      signals.push({ category: '3d-ar-vr', weight: 4, source: 'description_3d' });
    }

    // Chatbots
    if (desc.match(/\b(chatbot|conversational ai|chat interface|dialogue)\b/)) {
      signals.push({ category: 'chatbots-conversational-ai', weight: 4, source: 'description_chatbot' });
    }

    // Customer Service
    if (desc.match(/\b(customer service|customer support|support automation|help desk)\b/)) {
      signals.push({ category: 'customer-service-ai', weight: 4, source: 'description_customer_service' });
    }

    // Sales
    if (desc.match(/\b(sales|revenue intelligence|lead generation|sales enablement)\b/)) {
      signals.push({ category: 'sales-tools-intelligence', weight: 4, source: 'description_sales' });
    }

    // Marketing
    if (desc.match(/\b(marketing automation|email marketing|ad optimization|campaign)\b/)) {
      signals.push({ category: 'marketing-ai-automation', weight: 4, source: 'description_marketing' });
    }

    // LLM/Language Models
    if (desc.match(/\b(large language model|llm|language model|gpt|foundation model)\b/)) {
      signals.push({ category: 'llm-apis', weight: 4, source: 'description_llm' });
    }

    // ML/AutoML
    if (desc.match(/\b(machine learning|automl|ml platform|model training|deep learning)\b/)) {
      signals.push({ category: 'machine-learning-platforms', weight: 4, source: 'description_ml' });
    }

    // MLOps/DevOps
    if (desc.match(/\b(mlops|model deployment|ml monitoring|ci\/cd|devops)\b/)) {
      signals.push({ category: 'devops-mlops', weight: 4, source: 'description_mlops' });
    }

    // Data Analytics/BI
    if (desc.match(/\b(business intelligence|dashboard|data visualization|analytics|reporting)\b/)) {
      signals.push({ category: 'business-intelligence-visualization', weight: 4, source: 'description_bi' });
    }

    // Computer Vision
    if (desc.match(/\b(computer vision|object detection|image recognition|image segmentation|facial recognition)\b/)) {
      signals.push({ category: 'computer-vision', weight: 4, source: 'description_cv' });
    }

    // NLP/Text Analytics
    if (desc.match(/\b(nlp|natural language processing|text analytics|sentiment analysis|entity extraction)\b/)) {
      signals.push({ category: 'text-analytics-nlp', weight: 4, source: 'description_nlp' });
    }

    // Document Processing
    if (desc.match(/\b(ocr|document processing|document analysis|pdf|document ai)\b/)) {
      signals.push({ category: 'document-processing', weight: 4, source: 'description_document' });
    }

    // Legal
    if (desc.match(/\b(legal|contract analysis|compliance|e-discovery|legal research)\b/)) {
      signals.push({ category: 'legal-ai-compliance', weight: 4, source: 'description_legal' });
    }

    // Finance
    if (desc.match(/\b(finance|trading|fraud detection|risk management|financial)\b/)) {
      signals.push({ category: 'finance-trading-ai', weight: 4, source: 'description_finance' });
    }

    // Education
    if (desc.match(/\b(education|learning|tutoring|educational|training|test prep)\b/)) {
      signals.push({ category: 'education-learning-ai', weight: 4, source: 'description_education' });
    }

    // Cybersecurity
    if (desc.match(/\b(cybersecurity|security|threat detection|vulnerability|network security)\b/)) {
      signals.push({ category: 'cybersecurity-ai', weight: 4, source: 'description_security' });
    }

    // E-commerce
    if (desc.match(/\b(ecommerce|e-commerce|product recommendation|inventory|pricing)\b/)) {
      signals.push({ category: 'ecommerce-ai', weight: 4, source: 'description_ecommerce' });
    }

    // No-code/Low-code
    if (desc.match(/\b(no-code|low-code|visual builder|app builder|drag-and-drop)\b/)) {
      signals.push({ category: 'low-code-no-code-ai', weight: 4, source: 'description_nocode' });
    }

    // Workflow automation
    if (desc.match(/\b(workflow automation|process automation|rpa|task automation)\b/)) {
      signals.push({ category: 'workflow-automation', weight: 4, source: 'description_workflow' });
    }

    // AI Agents
    if (desc.match(/\b(ai agent|autonomous agent|multi-agent|agent platform)\b/)) {
      signals.push({ category: 'ai-agents-multi-agent', weight: 4, source: 'description_agent' });
    }

    // Vector/Semantic Search
    if (desc.match(/\b(vector database|semantic search|similarity search|embeddings)\b/)) {
      signals.push({ category: 'vector-databases-search', weight: 4, source: 'description_vector' });
    }

    // Data Labeling
    if (desc.match(/\b(data labeling|annotation|labeling tool|data annotation)\b/)) {
      signals.push({ category: 'data-labeling-annotation', weight: 4, source: 'description_labeling' });
    }
  }

  // Aggregate signals by category with weighted voting
  const categoryScores = {};
  signals.forEach(signal => {
    if (!categoryScores[signal.category]) {
      categoryScores[signal.category] = { score: 0, sources: [] };
    }
    categoryScores[signal.category].score += signal.weight;
    categoryScores[signal.category].sources.push(signal.source);
  });

  // Find the category with the highest score
  let bestCategory = null;
  let bestScore = 0;
  let bestSources = [];

  Object.entries(categoryScores).forEach(([category, data]) => {
    if (data.score > bestScore) {
      bestScore = data.score;
      bestCategory = category;
      bestSources = data.sources;
    }
  });

  // If no category determined, flag for manual review
  if (!bestCategory) {
    return {
      category: platform.category || 'ai-assistants-copilots', // default fallback
      megaCategory: megaCategories['ai-assistants-copilots'] || 'Business & Productivity',
      confidence: 'low',
      needsReview: true,
      reason: 'No mapping found for current category',
      sources: []
    };
  }

  return {
    category: bestCategory,
    megaCategory: megaCategories[bestCategory],
    confidence: bestScore >= 10 ? 'high' : bestScore >= 5 ? 'medium' : 'low',
    needsReview: bestScore < 5,
    score: bestScore,
    sources: bestSources
  };
}

// Process each platform
console.log(`\nProcessing ${platforms.length} platforms...\n`);

platforms.forEach((platform, index) => {
  const oldCategory = platform.category;
  const result = determineBestCategory(platform);

  // Update platform
  const oldPrimaryCategory = platform.category;
  platform.category = result.category;
  platform.mega_category = result.megaCategory;

  // Track changes
  if (oldPrimaryCategory !== result.category) {
    stats.recategorized++;
    stats.platformChanges.push({
      id: platform.id,
      name: platform.name,
      oldCategory: oldPrimaryCategory,
      newCategory: result.category,
      megaCategory: result.megaCategory,
      confidence: result.confidence,
      sources: result.sources
    });
  } else {
    stats.unchanged++;
  }

  // Track mapping
  if (oldCategory) {
    if (!stats.oldToNewMapping[oldCategory]) {
      stats.oldToNewMapping[oldCategory] = {};
    }
    if (!stats.oldToNewMapping[oldCategory][result.category]) {
      stats.oldToNewMapping[oldCategory][result.category] = 0;
    }
    stats.oldToNewMapping[oldCategory][result.category]++;
  }

  // Track distribution
  stats.categoryDistribution[result.category] = (stats.categoryDistribution[result.category] || 0) + 1;
  stats.megaCategoryDistribution[result.megaCategory] = (stats.megaCategoryDistribution[result.megaCategory] || 0) + 1;

  // Flag for manual review if needed
  if (result.needsReview) {
    stats.manualReview.push({
      id: platform.id,
      name: platform.name,
      oldCategory: oldCategory,
      newCategory: result.category,
      reason: result.reason || 'Low confidence score',
      confidence: result.confidence
    });
  }

  // Progress indicator
  if ((index + 1) % 100 === 0) {
    console.log(`Processed ${index + 1}/${platforms.length} platforms...`);
  }
});

console.log(`\nProcessing complete!\n`);

// Save updated platforms
fs.writeFileSync(platformsPath, JSON.stringify(platforms, null, 2));
console.log(`✓ Updated platforms.json saved\n`);

// Save statistics for report generation
fs.writeFileSync('./recategorization-stats.json', JSON.stringify(stats, null, 2));
console.log(`✓ Statistics saved to recategorization-stats.json\n`);

// Print summary
console.log('═══════════════════════════════════════════════════════════');
console.log('                  RECATEGORIZATION SUMMARY');
console.log('═══════════════════════════════════════════════════════════\n');

console.log(`Total Platforms: ${stats.totalPlatforms}`);
console.log(`Recategorized: ${stats.recategorized}`);
console.log(`Unchanged: ${stats.unchanged}`);
console.log(`Flagged for Manual Review: ${stats.manualReview.length}\n`);

console.log('Top 10 New Categories by Platform Count:');
console.log('─────────────────────────────────────────────────────────\n');
const sortedCategories = Object.entries(stats.categoryDistribution)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10);

sortedCategories.forEach(([cat, count], i) => {
  console.log(`${i + 1}. ${cat}: ${count} platforms`);
});

console.log('\n\nMega-Category Distribution:');
console.log('─────────────────────────────────────────────────────────\n');
const sortedMegaCategories = Object.entries(stats.megaCategoryDistribution)
  .sort((a, b) => b[1] - a[1]);

sortedMegaCategories.forEach(([megaCat, count]) => {
  const percentage = ((count / stats.totalPlatforms) * 100).toFixed(1);
  console.log(`${megaCat}: ${count} platforms (${percentage}%)`);
});

console.log('\n═══════════════════════════════════════════════════════════\n');
