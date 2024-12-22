
# **AI Post Generator - Desktop Applicatie**

Deze desktopapplicatie helpt gebruikers om professionele social media posts te genereren, afgestemd op hun bedrijf en doelgroep. Het ondersteunt meerdere platformen zoals LinkedIn en Twitter (X) en stelt gebruikers in staat om profielen, frameworks en geschiedenis van gegenereerde posts te beheren.

Installatiehandleiding

Volg de onderstaande stappen om de applicatie correct te installeren en te configureren.

1. Clone de repository

Clone de repository naar je lokale machine:
cd LinkedInPostGeneratorElectron

2. Installeer dependencies

Installeer de benodigde Node.js dependencies:

npm install

3. OpenAI API-sleutel instellen

Voeg je OpenAI API-sleutel toe aan het project. Maak een .env-bestand aan in de hoofdmap en voeg de volgende regel toe:

OPENAI_API_KEY=your-openai-api-key-here

	Belangrijk: Zorg dat je API-sleutel veilig blijft en niet deelt in publieke repositories.

4. Maak de benodigde .json-bestanden

De applicatie maakt gebruik van lokale .json-bestanden om profielen, frameworks en geschiedenis op te slaan. Maak de volgende bestanden in de rootmap aan:

profiles.json

[]

Dit bestand bevat de opgeslagen bedrijfsprofielen. Elk profiel heeft een structuur zoals:

[
{
"name": "Mijn Bedrijf",
"industry": "Technologie",
"audience": "MKB"
}
]

frameworks.json

[]

Dit bestand bevat opgeslagen frameworks. Elk framework heeft een structuur zoals:

[
{
"id": "fw-1234567890",
"topic": "Onderwerp",
"extraDescription": "Extra details",
"tone": "Professioneel",
"length": 200,
"platform": "LinkedIn"
}
]

history.json

[]

Dit bestand houdt een geschiedenis bij van gegenereerde posts. Elk item heeft een structuur zoals:

[
{
"id": "hist-1234567890",
"text": "De gegenereerde posttekst.",
"timestamp": "2024-12-22T12:00:00Z",
"platform": "LinkedIn",
"topic": "AI en Toekomst"
}
]

5. Start de applicatie

Start de Electron-applicatie:

npm start

Gebruikshandleiding

Profielen beheren
•	Voeg nieuwe profielen toe via het formulier aan de linkerkant.
•	Selecteer een profiel om het te koppelen aan je gegenereerde posts.

Frameworks opslaan
•	Configureer een post (onderwerp, platform, toon, etc.) en klik op Opslaan als Framework om het als template te bewaren.

Posts genereren
•	Kies een profiel, platform en taal.
•	Vul de velden in en klik op Genereer Post om een post te maken.
•	Bekijk het resultaat in de sectie Gegenereerde Post.

Geschiedenis bekijken
•	Bekijk eerder gegenereerde posts in de geschiedenis.
•	Klik op een geschiedenis-item voor meer details.

Best Practices
1.	API-sleutel: Bewaar je OpenAI-sleutel veilig in het .env-bestand. Deel deze nooit publiekelijk.
2.	Back-up JSON-bestanden: Sla regelmatig je .json-bestanden op om gegevensverlies te voorkomen.
3.	Experimenteer met toon en lengte: Pas de velden aan om te zien welke instellingen de beste resultaten geven.

Vereisten
•	Node.js v16 of hoger
•	OpenAI API-sleutel

Ondersteuning

Heb je hulp nodig? Neem contact op via contact@chinnovations.nl.

Veel succes en plezier met het gebruik van de AI Post Generator!