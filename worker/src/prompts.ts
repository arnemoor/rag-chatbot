interface PromptConfig {
  language: string;
  category: string;
  product: string;
}

const LANGUAGE_MAP: Record<string, string> = {
  en: 'English',
  de: 'German (Deutsch)',
  fr: 'French (Français)',
  it: 'Italian (Italiano)',
};

const TONE_MAP: Record<string, string> = {
  fiction: 'engaging, literary, and analytical',
  'non-fiction': 'informative, clear, and factual',
  science: 'precise, technical, and evidence-based',
  technology: 'practical, detailed, and solution-oriented',
  reference: 'comprehensive, authoritative, and well-structured',
  general: 'professional and helpful',
};

export function buildSystemPrompt(config: PromptConfig): string {
  const language = LANGUAGE_MAP[config.language] || 'English';
  const tone = TONE_MAP[config.category] || 'professional and helpful';

  return `You are a document assistant specialized in ${config.category} materials for ${config.product}.

CRITICAL INSTRUCTIONS:
1. YOU MUST RESPOND ONLY IN ${language.toUpperCase()}. This is mandatory regardless of the language of the source documents.
2. Use a ${tone} communication style
3. You MUST answer the question using the information from the provided context documents
4. Base your answers EXCLUSIVELY on the provided context - do not use external knowledge
5. If the specific information is not in the context, say so clearly
6. Cite source documents by name only (e.g., "according to the reference guide") - do not include file paths or URLs

IMPORTANT: Your entire response MUST be in ${language}. Translate any content from the source documents into ${language} when answering.

Content Guidelines:
- Use appropriate terminology for ${config.category} content
- Maintain accuracy and proper attribution of sources
- Provide relevant, actionable information
- Be concise but thorough in your responses
- Include relevant context or additional information when applicable

Response Format:
- Start with a direct answer to the question
- Provide supporting details from the documentation
- End with source references (e.g., "Source: [filename]")`;
}

export function buildQueryRewritePrompt(query: string, config: PromptConfig): string {
  const language = LANGUAGE_MAP[config.language] || 'English';

  return `Rewrite the following query about ${config.category} content to improve search relevance.
Include relevant synonyms and related terms.
Maintain the original language (${language}) and intent.

Original query: ${query}

Rewritten query (include synonyms and related terms):`;
}

// Multilingual response templates
export const RESPONSE_TEMPLATES = {
  no_information: {
    en: "I don't have information about this topic in the available documentation.",
    de: 'Ich habe keine Informationen zu diesem Thema in der verfügbaren Dokumentation.',
    fr: "Je n'ai pas d'informations sur ce sujet dans la documentation disponible.",
    it: 'Non ho informazioni su questo argomento nella documentazione disponibile.',
  },
  error_occurred: {
    en: 'An error occurred while processing your request. Please try again.',
    de: 'Bei der Bearbeitung Ihrer Anfrage ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.',
    fr: "Une erreur s'est produite lors du traitement de votre demande. Veuillez réessayer.",
    it: "Si è verificato un errore durante l'elaborazione della richiesta. Si prega di riprovare.",
  },
  greeting: {
    en: 'Hello! How can I help you today?',
    de: 'Hallo! Wie kann ich Ihnen heute helfen?',
    fr: "Bonjour! Comment puis-je vous aider aujourd'hui?",
    it: 'Ciao! Come posso aiutarti oggi?',
  },
};
