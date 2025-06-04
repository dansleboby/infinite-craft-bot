// index.js (ou votre fichier principal)

const fs = require('fs');
const path = require('path');
const minimist = require('minimist');
const neo4j = require('neo4j-driver');
require('dotenv').config();

// Import du package officiel OpenAI
const OpenAI = require('openai');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

const modelPricing = {
  "gpt-4.1": {
    input: 0.002,         // $2.00 / 1 000 000 = $0.002 per 1 000 tokens
    cachedInput: 0.0005,  // $0.50 / 1 000 000 = $0.0005 per 1 000 tokens
    output: 0.008         // $8.00 / 1 000 000 = $0.008 per 1 000 tokens
  },
  "gpt-4.1-mini": {
    input: 0.0004,        // $0.40 / 1 000 000 = $0.0004 per 1 000 tokens
    cachedInput: 0.0001,  // $0.10 / 1 000 000 = $0.0001 per 1 000 tokens
    output: 0.0016        // $1.60 / 1 000 000 = $0.0016 per 1 000 tokens
  },
  "gpt-4.1-nano": {
    input: 0.0001,        // $0.10 / 1 000 000 = $0.0001 per 1 000 tokens
    cachedInput: 0.000025,// $0.025 / 1 000 000 = $0.000025 per 1 000 tokens
    output: 0.0004        // $0.40 / 1 000 000 = $0.0004 per 1 000 tokens
  },
  "gpt-4.5-preview": {
    input: 0.075,         // $75.00 / 1 000 000 = $0.075 per 1 000 tokens
    cachedInput: 0.0375,  // $37.50 / 1 000 000 = $0.0375 per 1 000 tokens
    output: 0.15          // $150.00 / 1 000 000 = $0.15 per 1 000 tokens
  },
  "gpt-4o": {
    input: 0.0025,        // $2.50 / 1 000 000 = $0.0025 per 1 000 tokens
    cachedInput: 0.00125, // $1.25 / 1 000 000 = $0.00125 per 1 000 tokens
    output: 0.01          // $10.00 / 1 000 000 = $0.01 per 1 000 tokens
  },
  "gpt-4o-audio-preview": {
    input: 0.0025,        // $2.50 / 1 000 000 = $0.0025 per 1 000 tokens
    cachedInput: null,    // no “Cached input” price
    output: 0.01          // $10.00 / 1 000 000 = $0.01 per 1 000 tokens
  },
  "gpt-4o-realtime-preview": {
    input: 0.005,         // $5.00 / 1 000 000 = $0.005 per 1 000 tokens
    cachedInput: 0.0025,  // $2.50 / 1 000 000 = $0.0025 per 1 000 tokens
    output: 0.02          // $20.00 / 1 000 000 = $0.02 per 1 000 tokens
  },
  "gpt-4o-mini": {
    input: 0.00015,       // $0.15 / 1 000 000 = $0.00015 per 1 000 tokens
    cachedInput: 0.000075,// $0.075 / 1 000 000 = $0.000075 per 1 000 tokens
    output: 0.0006        // $0.60 / 1 000 000 = $0.0006 per 1 000 tokens
  },
  "gpt-4o-mini-audio-preview": {
    input: 0.00015,       // $0.15 / 1 000 000 = $0.00015 per 1 000 tokens
    cachedInput: null,    // no “Cached input” price
    output: 0.0006        // $0.60 / 1 000 000 = $0.0006 per 1 000 tokens
  },
  "gpt-4o-mini-realtime-preview": {
    input: 0.0006,        // $0.60 / 1 000 000 = $0.0006 per 1 000 tokens
    cachedInput: 0.0003,  // $0.30 / 1 000 000 = $0.0003 per 1 000 tokens
    output: 0.0024        // $2.40 / 1 000 000 = $0.0024 per 1 000 tokens
  },
  "o1": {
    input: 0.015,         // $15.00 / 1 000 000 = $0.015 per 1 000 tokens
    cachedInput: 0.0075,  // $7.50 / 1 000 000 = $0.0075 per 1 000 tokens
    output: 0.06          // $60.00 / 1 000 000 = $0.06 per 1 000 tokens
  },
  "o1-pro": {
    input: 0.15,          // $150.00 / 1 000 000 = $0.15 per 1 000 tokens
    cachedInput: null,    // no “Cached input” price
    output: 0.6           // $600.00 / 1 000 000 = $0.6 per 1 000 tokens
  },
  "o3": {
    input: 0.01,          // $10.00 / 1 000 000 = $0.01 per 1 000 tokens
    cachedInput: 0.0025,  // $2.50 / 1 000 000 = $0.0025 per 1 000 tokens
    output: 0.04          // $40.00 / 1 000 000 = $0.04 per 1 000 tokens
  },
  "o4-mini": {
    input: 0.0011,        // $1.10 / 1 000 000 = $0.0011 per 1 000 tokens
    cachedInput: 0.000275,// $0.275 / 1 000 000 = $0.000275 per 1 000 tokens
    output: 0.0044        // $4.40 / 1 000 000 = $0.0044 per 1 000 tokens
  },
  "o3-mini": {
    input: 0.0011,        // $1.10 / 1 000 000 = $0.0011 per 1 000 tokens
    cachedInput: 0.00055, // $0.55 / 1 000 000 = $0.00055 per 1 000 tokens
    output: 0.0044        // $4.40 / 1 000 000 = $0.0044 per 1 000 tokens
  },
  "o1-mini": {
    input: 0.0011,        // $1.10 / 1 000 000 = $0.0011 per 1 000 tokens
    cachedInput: 0.00055, // $0.55 / 1 000 000 = $0.00055 per 1 000 tokens
    output: 0.0044        // $4.40 / 1 000 000 = $0.0044 per 1 000 tokens
  }
};


// -----------------------------------------------------------------------------
// 1) Chargement de la config JSON (delay, saveInterval) s’il existe
// -----------------------------------------------------------------------------
const configPath = path.join(__dirname, 'config.json');
let config = { delay: 300, saveInterval: 10 };
try {
  Object.assign(config, JSON.parse(fs.readFileSync(configPath)));
} catch (e) {
  // Si config.json n’existe pas ou n’est pas valide, on garde les valeurs par défaut.
}

// -----------------------------------------------------------------------------
// 2) Lecture des arguments CLI avec minimist
// -----------------------------------------------------------------------------
const argv = minimist(process.argv.slice(2), {
  default: {
    runs: Infinity,
    delay: config.delay,
    saveInterval: config.saveInterval,
  },
});

// -----------------------------------------------------------------------------
// 3) Chargement des données (items + failed_recipes) depuis le dossier ./data
// -----------------------------------------------------------------------------
const dataDir = path.join(__dirname, 'data');

let items = JSON.parse(
  fs.readFileSync(path.join(dataDir, 'recipes.json'))
);
let failedRecipes = JSON.parse(
  fs.readFileSync(path.join(dataDir, 'failed_recipes.json'))
);

// -----------------------------------------------------------------------------
// 4) Variables globales
// -----------------------------------------------------------------------------
const timeDelay = argv.delay;       // délai entre chaque appel OpenAI (en ms)
const saveInterval = argv.saveInterval;
const timeout = async (t) => new Promise((r) => setTimeout(r, t));

let graphDriver = null;
if (process.env.NEO4J_URI) {
  graphDriver = neo4j.driver(
    process.env.NEO4J_URI,
    neo4j.auth.basic(
      process.env.NEO4J_USER || '',
      process.env.NEO4J_PASSWORD || ''
    )
  );
}

let runCounter = 0;
let openaiCalls = 0;
let totalEstimatedCost = 0;
const openaiLimit = parseInt(process.env.OPENAI_MAX_CALLS || '0', 10);
const openaiModel = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';

// -----------------------------------------------------------------------------
// 5) Initialisation du client OpenAI
// -----------------------------------------------------------------------------
if (!process.env.OPENAI_API_KEY) {
  console.error("⚠️  Il manque la variable d’environnement OPENAI_API_KEY !");
  process.exit(1);
}
const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// -----------------------------------------------------------------------------
// 6) Fonction search(s1, s2) qui appelle OpenAI via openaiClient.createChatCompletion
// -----------------------------------------------------------------------------
async function search(s1, s2) {
  // Vérification du quota d’appels OpenAI (si OPENAI_MAX_CALLS est configuré)
  if (openaiLimit && openaiCalls >= openaiLimit) {
    throw new Error('OpenAI call limit reached');
  }
  openaiCalls++;

  // On construit la liste de messages pour l’API Chat Completion
  const messages = [
    {
      role: "system",
      content:
        "You are a helpful assistant that helps people to craft new things by combining two words into ther fusions. " +
        "The most important rules that you have to follow with every single answer that you are not allowed to use the words " +
        s1 +
        " and " +
        s2 +
        " as part of your answer" +
        "DO NOT INCLUDE THE WORDS " +
        s1 +
        " and " +
        s2 +
        " as part of the answer!!!!! The words " +
        s1 +
        " and " +
        s2 +
        " may NOT be part of the answer. " +
        "No special characters, no numbers, no URLs, no code, no commands, no programming, all lowercase. " +
        "The order of the both words does not matter, both are equally important. " +
        "The answer has to be related to both words and the context of the words. " +
        "The answer can either be a combination of the words or the role of one word in relation to the other. " +
        "The answer must be in FRENCH. " +
        "Answers can be things, materials, people, companies, animals, occupations, food, places, objects, emotions, events, concepts, natural phenomena, body parts, vehicles, sports, clothing, furniture, technology, buildings, instruments, beverages, plants, academic subjects and everything else you can think"
    },
    {
      role: "user",
      content: `Reply with a JSON object like {"result":"word","emoji":""} representing the combination of ${s1} and ${s2}.`
    }
  ];

  // Appel à l’API OpenAI
  let completion;
  try {
    completion = await openaiClient.chat.completions.create({
      model: openaiModel,
      messages: messages,
      max_tokens: 100,      // ajustez si besoin (ne renvoyez pas de phrase trop longue)
      temperature: 0.7,    // plus élevé => plus créatif
      n: 1
    });
  } catch (err) {
    throw new Error(`OpenAI error: ${err.message}`);
  }

  if (completion.usage && modelPricing[openaiModel]) {
    const inputTokens = completion.usage.prompt_tokens;
    const outputTokens = completion.usage.completion_tokens;
    const pricing = modelPricing[openaiModel];
    
    const callCost = (inputTokens / 1000 * pricing.input) + (outputTokens / 1000 * pricing.output);
    totalEstimatedCost += callCost;
    
    console.log(`${colors.cyan}💰 Coût de cet appel: $${callCost.toFixed(6)} | Coût total estimé: $${totalEstimatedCost.toFixed(4)}${colors.reset}`);
  }

  // Récupère le texte renvoyé par l'API
  if (!completion || !completion.choices || completion.choices.length === 0) {
    console.error("OpenAI did not return a valid response:", completion);
    throw new Error("OpenAI did not return a valid response");
  }
  const text = completion.choices[0].message.content.trim();

  // On essaye de parser en JSON, sinon on renvoie un objet basique
  try {
    console.log(`${colors.green}✅ OpenAI response: ${text}${colors.reset}`);
    return JSON.parse(text);
  } catch {
    return { result: text, emoji: "" };
  }
}

// -----------------------------------------------------------------------------
// 7) Fonctions utilitaires pour sélectionner 2 items (weightedRNG, weightedWeights, selectItems, compareRecipes, etc.)
// -----------------------------------------------------------------------------
/**
 * Générateur de nombres aléatoires avec distribution pondérée plus robuste
 * Utilise une validation des poids et gestion des cas d'erreur
 */
function weightedRNG(weights) {
  // Validation des poids
  if (!weights || weights.length === 0) {
    return 0;
  }
  
  // Filtre les poids invalides et s'assure qu'il y a au moins un poids positif
  const validWeights = weights.map(w => Math.max(0, isNaN(w) ? 0 : w));
  const totalWeight = validWeights.reduce((sum, w) => sum + w, 0);
  
  if (totalWeight === 0) {
    // Si tous les poids sont 0, sélection uniforme
    return Math.floor(Math.random() * weights.length);
  }
  
  // Sélection pondérée classique mais plus robuste
  let rand = Math.random() * totalWeight;
  let cumulative = 0;
  
  for (let i = 0; i < validWeights.length; i++) {
    cumulative += validWeights[i];
    if (rand <= cumulative) {
      return i;
    }
  }
  
  // Fallback en cas d'erreur de précision flottante
  return validWeights.length - 1;
}

/**
 * Calcul des poids pondérés plus sophistiqué avec plusieurs facteurs
 * - Diversité: favorise les items moins utilisés
 * - Succès: favorise les items qui ont créé de nouvelles combinaisons
 * - Récence: favorise légèrement les nouveaux items
 * - Équilibrage: évite que certains items dominent complètement
 */
function weightedWeights(objs) {
  if (!objs || objs.length === 0) {
    return [];
  }
  
  // Calcul des statistiques globales pour la normalisation
  const totalItems = objs.length;
  const maxIngredient = Math.max(...objs.map(x => x.timesIngredient || 0));
  const maxFail = Math.max(...objs.map(x => x.timesFail || 0));
  const maxDupe = Math.max(...objs.map(x => x.timesDupe || 0));
  
  return objs.map((x, index) => {
    const timesIngredient = x.timesIngredient || 0;
    const timesFail = x.timesFail || 0;
    const timesDupe = x.timesDupe || 0;
    
    // Facteur de base: encourage l'utilisation mais évite la sur-utilisation
    let baseWeight = Math.log(timesIngredient + 2); // +2 pour éviter log(0)
    
    // Facteur de diversité: favorise les items moins utilisés
    const diversityFactor = maxIngredient > 0 
      ? 1 + (maxIngredient - timesIngredient) / (maxIngredient + 1)
      : 1;
    
    // Facteur de succès: pénalise les échecs et duplicatas
    const failPenalty = maxFail > 0 ? (timesFail / (maxFail + 1)) * 0.3 : 0;
    const dupePenalty = maxDupe > 0 ? (timesDupe / (maxDupe + 1)) * 0.1 : 0;
    const successFactor = Math.max(0.1, 1 - failPenalty - dupePenalty);
    
    // Facteur de position: légère favorisation des nouveaux items (ajoutés récemment)
    const positionFactor = 1 + (index / totalItems) * 0.2;
    
    // Facteur d'équilibrage: empêche les poids de devenir trop extrêmes
    const balanceFactor = Math.min(3, Math.max(0.3, baseWeight * diversityFactor * successFactor * positionFactor));
    
    return balanceFactor;
  });
}

function selectItems() {
  const maxRetries = 5;
  const minItemsThreshold = 2; // Minimum d'items nécessaires
  
  // Validation initiale
  if (!items || items.length < minItemsThreshold) {
    console.warn(`Pas assez d'items disponibles (${items?.length || 0}). Minimum requis: ${minItemsThreshold}`);
    if (items && items.length === 1) {
      return [0, 0]; // Cas spécial : utiliser le même item deux fois
    }
    throw new Error('Items insuffisants pour la sélection');
  }
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Sélection du premier item avec pondération
      const weights1 = weightedWeights(items);
      if (!weights1 || weights1.length === 0) {
        throw new Error('Impossible de calculer les poids pour le premier item');
      }
      
      const item1Index = weightedRNG(weights1);
      if (item1Index < 0 || item1Index >= items.length) {
        console.warn(`Index invalide pour item1: ${item1Index}, tentative ${attempt + 1}`);
        continue;
      }
      
      const item1Product = items[item1Index].product;
      if (!item1Product) {
        console.warn(`Product invalide pour item1 à l'index ${item1Index}, tentative ${attempt + 1}`);
        continue;
      }
      
      // Construction plus robuste du set des recettes existantes
      let recipesItem1 = new Set();
      try {
        // Recettes existantes utilisant item1
        const existingRecipes = items
          .filter(x => x.recipes && Array.isArray(x.recipes))
          .map(x => x.recipes)
          .flat(1)
          .filter(x => Array.isArray(x) && x.length >= 2);
        
        // Recettes échouées utilisant item1
        const failedRecipesArray = Array.isArray(failedRecipes) ? failedRecipes : [];
        
        const allRecipes = existingRecipes.concat(failedRecipesArray);
        
        allRecipes
          .filter(x => x[0] === item1Product || x[1] === item1Product)
          .forEach(x => {
            const otherProduct = x[0] === item1Product ? x[1] : x[0];
            if (otherProduct && typeof otherProduct === 'string') {
              recipesItem1.add(otherProduct);
            }
          });
      } catch (error) {
        console.warn(`Erreur lors de la construction des recettes pour ${item1Product}:`, error.message);
        recipesItem1 = new Set(); // Fallback: set vide
      }
      
      // Sélection des candidats pour le deuxième item
      let item2Candidates;
      if (recipesItem1.size === 0) {
        // Aucune recette connue - tous les items sont candidates
        item2Candidates = items.slice(); // Copie pour éviter les mutations
      } else {
        // Filtrer les items déjà testés avec item1
        item2Candidates = items.filter(x => 
          x && x.product && 
          !recipesItem1.has(x.product) && 
          x.product !== item1Product // Éviter de sélectionner le même item
        );
      }
      
      // Vérification de la disponibilité des candidats
      if (item2Candidates.length === 0) {
        if (attempt === maxRetries - 1) {
          // Dernière tentative : utiliser une stratégie de fallback
          console.warn(`Aucun candidat disponible pour item2 avec ${item1Product}, utilisation de fallback`);
          item2Candidates = items.filter(x => x && x.product && x.product !== item1Product);
          if (item2Candidates.length === 0) {
            // Cas extrême : permettre le même item
            item2Candidates = [items[item1Index]];
          }
        } else {
          console.warn(`Aucun candidat pour item2 avec ${item1Product}, retry ${attempt + 1}`);
          continue; // Retry avec un nouvel item1
        }
      }
      
      // Sélection du deuxième item
      const weights2 = weightedWeights(item2Candidates);
      if (!weights2 || weights2.length === 0) {
        console.warn(`Impossible de calculer les poids pour item2, tentative ${attempt + 1}`);
        continue;
      }
      
      const item2Index = weightedRNG(weights2);
      if (item2Index < 0 || item2Index >= item2Candidates.length) {
        console.warn(`Index invalide pour item2: ${item2Index}, tentative ${attempt + 1}`);
        continue;
      }
      
      const selectedItem2 = item2Candidates[item2Index];
      if (!selectedItem2 || !selectedItem2.product) {
        console.warn(`Item2 invalide à l'index ${item2Index}, tentative ${attempt + 1}`);
        continue;
      }
      
      // Trouve l'index global du deuxième item
      const globalIndex2 = items.findIndex(x => x && x.product === selectedItem2.product);
      if (globalIndex2 === -1) {
        console.warn(`Impossible de trouver l'index global pour ${selectedItem2.product}, tentative ${attempt + 1}`);
        continue;
      }
      
      // Validation finale
      if (item1Index === globalIndex2 && items.length > 1) {
        console.warn(`Sélection du même item évitée (${item1Product}), tentative ${attempt + 1}`);
        continue;
      }
      
      // Succès !
      return [item1Index, globalIndex2];
      
    } catch (error) {
      console.warn(`Erreur lors de la sélection, tentative ${attempt + 1}:`, error.message);
      if (attempt === maxRetries - 1) {
        throw error; // Re-lancer à la dernière tentative
      }
    }
  }
  
  // Fallback final en cas d'échec total
  console.error('Échec de toutes les tentatives de sélection, utilisation du fallback d\'urgence');
  const fallbackIndex1 = Math.floor(Math.random() * items.length);
  let fallbackIndex2 = Math.floor(Math.random() * items.length);
  
  // Éviter le même index si possible
  if (items.length > 1 && fallbackIndex1 === fallbackIndex2) {
    fallbackIndex2 = (fallbackIndex2 + 1) % items.length;
  }
  
  return [fallbackIndex1, fallbackIndex2];
}

function compareRecipes(recipe1, recipe2) {
  return (
    (recipe1[0] === recipe2[0] && recipe1[1] === recipe2[1]) ||
    (recipe1[0] === recipe2[1] && recipe1[1] === recipe2[0])
  );
}

// -----------------------------------------------------------------------------
// 8) Fonction pour logger dans Neo4j (si configuré)
// -----------------------------------------------------------------------------
let graphSession = null;

async function initGraphSession() {
  if (!graphDriver || graphSession) return;
  try {
    graphSession = graphDriver.session();
    console.log(`${colors.green}📊 Session Neo4j initialisée${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}❌ Erreur lors de l'initialisation de la session Neo4j:${colors.reset}`, error.message);
  }
}

async function closeGraphSession() {
  if (graphSession) {
    try {
      await graphSession.close();
      graphSession = null;
      console.log(`${colors.green}📊 Session Neo4j fermée${colors.reset}`);
    } catch (error) {
      console.error(`${colors.red}❌ Erreur lors de la fermeture de la session Neo4j:${colors.reset}`, error.message);
    }
  }
}

async function logToGraph(recipe, product) {
  if (!graphDriver || !recipe || !product) return;
  
  // Validation des paramètres
  if (!Array.isArray(recipe) || recipe.length < 2 || !recipe[0] || !recipe[1]) {
    console.warn(`${colors.yellow}⚠️  Recette invalide pour Neo4j:${colors.reset}`, recipe);
    return;
  }

  // Initialiser la session si nécessaire
  if (!graphSession) {
    await initGraphSession();
    if (!graphSession) return; // Échec d'initialisation
  }

  try {
    await graphSession.executeWrite(tx =>
      tx.run(
        `
        MERGE (a:Item {name: $a})
        MERGE (b:Item {name: $b})
        MERGE (c:Item {name: $c})
        
        // Créer une relation bidirectionnelle unique
        MERGE (a)-[r1:COMBINES_WITH]->(c)
        ON CREATE SET r1.ingredient = $b, r1.created_at = datetime()
        ON MATCH SET r1.times_used = COALESCE(r1.times_used, 0) + 1
        
        MERGE (b)-[r2:COMBINES_WITH]->(c)
        ON CREATE SET r2.ingredient = $a, r2.created_at = datetime()
        ON MATCH SET r2.times_used = COALESCE(r2.times_used, 0) + 1
        
        // Ajouter des propriétés aux items
        SET a.last_used = datetime(), a.usage_count = COALESCE(a.usage_count, 0) + 1
        SET b.last_used = datetime(), b.usage_count = COALESCE(b.usage_count, 0) + 1
        SET c.created_at = COALESCE(c.created_at, datetime())
        `,
        { 
          a: recipe[0].trim(), 
          b: recipe[1].trim(), 
          c: product.trim() 
        }
      )
    );
  } catch (error) {
    console.error(`${colors.red}❌ Erreur lors de l'écriture dans Neo4j:${colors.reset}`, error.message);
    
    // Tenter de récréer la session en cas d'erreur de connexion
    if (error.message.includes('session') || error.message.includes('connection')) {
      console.log(`${colors.yellow}🔄 Tentative de reconnexion à Neo4j...${colors.reset}`);
      await closeGraphSession();
      await initGraphSession();
    }
  }
}

// -----------------------------------------------------------------------------
// 9) Boucle principale run()
// -----------------------------------------------------------------------------
async function run() {
  // Initialiser la session Neo4j au premier appel
  if (runCounter === 0) {
    await initGraphSession();
  }
  // On sélectionne deux items au hasard (pondérés)
  let [idx1, idx2] = selectItems();
  let recipe = [items[idx1].product, items[idx2].product];

  // Appel OpenAI pour générer le nouveau "product"
  let searchObj;
  try {
    console.log(`${colors.blue}🔍 Recherche: ${colors.yellow}${recipe[0]}${colors.blue} + ${colors.yellow}${recipe[1]}${colors.reset}`);
    searchObj = await search(recipe[0], recipe[1]);
  } catch (err) {
    console.error("Erreur search() :", err.message);
    process.exit(1);
  }

  let product = searchObj.result;

  if (product === "Nothing" || !product) {
    // Si l’API renvoie "Nothing" ou rien, on marque un échec
    items[idx1].timesFail += 1;
    items[idx2].timesFail += 1;
    failedRecipes.push(recipe);
  } else if (items.find(x => x.product === product)) {
    // Si ce product existe déjà dans items => dupe
    const itemFind = items.find(x => x.product === product);
    items[idx1].timesDupe += 1;
    items[idx2].timesDupe += 1;

    // On ajoute la recette si elle n’existe pas déjà
    if (!itemFind.recipes.some(x => compareRecipes(x, recipe))) {
      itemFind.recipes.push(recipe);
    }
  } else {
    // Nouveau product découvert
    items.push({
      product: product,
      emoji: searchObj.emoji || "",
      timesIngredient: 0,
      timesFail: 0,
      timesDupe: 0,
      recipes: [recipe]
    });

    console.log(`Discovered ${recipe[0]} + ${recipe[1]} => ${product}`);

    items[idx1].timesIngredient += 1;
    items[idx2].timesIngredient += 1;

    // Sauvegarde périodique
    if (items.length % saveInterval === 0) {
      fs.writeFileSync(
        path.join(dataDir, 'recipes.json'),
        JSON.stringify(items, null, 4)
      );
      fs.writeFileSync(
        path.join(dataDir, 'failed_recipes.json'),
        JSON.stringify(failedRecipes, null, 4)
      );
      console.log(`Wrote items list of length ${items.length} to recipes.json!`);
    }

    // On logue dans Neo4j
    await logToGraph(recipe, product);
  }

  runCounter++;
  if (runCounter >= argv.runs) {
    // Fin du nombre de runs demandé : on ferme Neo4j et on écrit fichiers finaux
    if (graphDriver) {
      await graphDriver.close();
    }
    fs.writeFileSync(
      path.join(dataDir, 'recipes.json'),
      JSON.stringify(items, null, 4)
    );
    fs.writeFileSync(
      path.join(dataDir, 'failed_recipes.json'),
      JSON.stringify(failedRecipes, null, 4)
    );
    return;
  }

  // Sinon, on attend le délai puis on relance run()
  await timeout(timeDelay);
  await run();
}

// -----------------------------------------------------------------------------
// 10) Lancement de la boucle
// -----------------------------------------------------------------------------
run().catch(async (err) => {
  console.error("Erreur inattendue :", err);
  if (graphDriver) {
    await graphDriver.close();
  }
  process.exit(1);
});
