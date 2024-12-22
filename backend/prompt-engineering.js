require('dotenv').config();
// backend/prompt-engineering.js
const { Configuration, OpenAIApi } = require('openai');

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

/**
 * generateLinkedInPost
 *  -> gpt-3.5-turbo (chat-based)
 */
async function generateLinkedInPost({
                                        companyName = 'Onbekend Bedrijf',
                                        industry = 'Algemene Industrie',
                                        targetAudience = 'Doelgroep onbekend',
                                        topic = 'Onderwerp onbekend',
                                        extraDescription = '',
                                        tone = 'professioneel',
                                        length = '200',
                                    }) {
    // We bouwen een chat-conversatie op met system- en user-messages:
    const messages = [
        {
            role: 'system',
            content: 'Je bent een ervaren copywriter die professionele LinkedIn-posts schrijft.',
        },
        {
            role: 'user',
            content: `
        Schrijf een LinkedIn-post over "${topic}" in een ${tone} toon 
        voor het bedrijf "${companyName}" (actief in ${industry}), gericht op ${targetAudience}.
        
        Gebruik de volgende extra details:
        ${extraDescription}

        Richt je op praktische tips of inzichten en eindig met een call-to-action.
        Probeer de post rond de ${length} woorden te houden (het is indicatief, je mag iets afwijken).
        
        Zorg dat de uiteindelijke post helder en overtuigend is, klaar om te publiceren.
      `,
        },
    ];

    // We gebruiken createChatCompletion, omdat gpt-3.5-turbo een chatmodel is
    const response = await openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages,
        max_tokens: 500,
        temperature: 0.7,
    });

    // Het antwoord staat in response.data.choices[0].message.content
    return response.data.choices[0].message.content.trim();
}

/**
 * generateTwitterPost
 *  -> text-davinci-003 (completion-based)
 */
async function generateTwitterPost({
                                       companyName = 'Onbekend Bedrijf',
                                       industry = 'Algemene Industrie',
                                       targetAudience = 'Doelgroep onbekend',
                                       topic = 'Onderwerp onbekend',
                                   }) {
    const prompt = `
    Je bent een ervaren copywriter voor het bedrijf "${companyName}", dat actief is in ${industry}.
    De doelgroep is ${targetAudience}. Schrijf een beknopte Twitter-post (maximaal 280 tekens) 
    over "${topic}". Gebruik een vlotte en pakkende stijl, voeg 1-2 relevante hashtags toe.
  `;

    const response = await openai.createCompletion({
        model: 'text-davinci-003',
        prompt,
        max_tokens: 100,
        temperature: 0.7,
    });

    return response.data.choices[0].text.trim();
}

/**
 * generateInstagramPost
 *  -> text-davinci-003 (completion-based)
 */
async function generateInstagramPost({
                                         companyName = 'Onbekend Bedrijf',
                                         industry = 'Algemene Industrie',
                                         targetAudience = 'Doelgroep onbekend',
                                         topic = 'Onderwerp onbekend',
                                     }) {
    const prompt = `
    Je bent een ervaren copywriter voor het bedrijf "${companyName}", dat actief is in ${industry}.
    De doelgroep is ${targetAudience}. Schrijf een Instagram-caption over "${topic}" met een positieve, 
    inspirerende toon. Gebruik enkele relevante hashtags en emoji's. Houd de lengte ongeveer 100-150 woorden.
  `;

    const response = await openai.createCompletion({
        model: 'text-davinci-003',
        prompt,
        max_tokens: 200,
        temperature: 0.7,
    });

    return response.data.choices[0].text.trim();
}

module.exports = {
    generateLinkedInPost,
    generateTwitterPost,
    generateInstagramPost,
};