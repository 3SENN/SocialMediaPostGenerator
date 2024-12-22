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
                                        language = 'Dutch'
                                    }) {
    const systemContent =
        language === 'English'
            ? 'You are an experienced copywriter who writes professional LinkedIn posts in English.'
            : 'Je bent een ervaren copywriter die professionele LinkedIn-posts schrijft in het Nederlands.';

    const userContent =
        language === 'English'
            ? `
                Write a LinkedIn post about "${topic}" in a ${tone} tone 
                for the company "${companyName}" (active in ${industry}), aimed at ${targetAudience}.
                
                Use the following extra details:
                ${extraDescription}
    
                Provide practical tips or insights and end with a call-to-action.
                Try to keep the post around ${length} words (this is indicative, you can deviate a bit).
    
                Make sure the final post is clear and persuasive, ready to publish.
            `
            : `
                Schrijf een LinkedIn-post over "${topic}" in een ${tone} toon 
                voor het bedrijf "${companyName}" (actief in ${industry}), gericht op ${targetAudience}.
                
                Gebruik de volgende extra details:
                ${extraDescription}
    
                Richt je op praktische tips of inzichten en eindig met een call-to-action.
                Probeer de post rond de ${length} woorden te houden (het is indicatief, je mag iets afwijken).
    
                Zorg dat de uiteindelijke post helder en overtuigend is, klaar om te publiceren.
            `;

    const messages = [
        {
            role: 'system',
            content: systemContent
        },
        {
            role: 'user',
            content: userContent
        }
    ];

    const response = await openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages,
        max_tokens: 500,
        temperature: 0.7
    });

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
                                       language = 'Dutch'
                                   }) {
    const prompt =
        language === 'English'
            ? `
                You are an experienced copywriter for the company "${companyName}" in ${industry}.
                The audience is ${targetAudience}. Write a short, punchy tweet (max 280 characters)
                about "${topic}". Use a catchy style and add 1-2 relevant hashtags.
            `
            : `
                Je bent een ervaren copywriter voor het bedrijf "${companyName}" in ${industry}.
                De doelgroep is ${targetAudience}. Schrijf een beknopte, pakkende tweet (max 280 tekens)
                over "${topic}". Gebruik een vlotte stijl en voeg 1-2 relevante hashtags toe.
            `;

    const response = await openai.createCompletion({
        model: 'text-davinci-003',
        prompt,
        max_tokens: 100,
        temperature: 0.7,
    });

    return response.data.choices[0].text.trim();
}

async function generateInstagramPost({
                                         companyName = 'Onbekend Bedrijf',
                                         industry = 'Algemene Industrie',
                                         targetAudience = 'Doelgroep onbekend',
                                         topic = 'Onderwerp onbekend',
                                         language = 'Dutch'
                                     }) {
    const prompt =
        language === 'English'
            ? `
                You are an experienced copywriter for the company "${companyName}" in ${industry}.
                The audience is ${targetAudience}. Write an inspiring Instagram caption about "${topic}" 
                with a positive, engaging tone. Include some relevant hashtags and emojis.
                Keep it around 100-150 words if possible.
            `
            : `
                Je bent een ervaren copywriter voor het bedrijf "${companyName}" in ${industry}.
                De doelgroep is ${targetAudience}. Schrijf een inspirerende Instagram-caption over "${topic}"
                met een positieve, enthousiasmerende toon. Voeg enkele relevante hashtags en emoji's toe.
                Houd het rond de 100-150 woorden.
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