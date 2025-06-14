const fs = require('fs');
const path = require('path');
const neo4j = require('neo4j-driver');
require('dotenv').config();

const dataDir = path.join(__dirname, 'data');

async function resetDatabase() {
    // Reset local JSON files
    let resetRecipe = fs.readFileSync(path.join(dataDir, 'RESET_RECIPE.json'));
    fs.writeFileSync(path.join(dataDir, 'recipes.json'), resetRecipe);
    fs.writeFileSync(path.join(dataDir, 'failed_recipes.json'), '[]');

    console.log('Local files reset successfully.');

    // Reset Neo4j database if configured
    if (process.env.NEO4J_URI && process.env.NEO4J_USER && process.env.NEO4J_PASSWORD) {
        console.log('Resetting Neo4j database...');
        
        const driver = neo4j.driver(
            process.env.NEO4J_URI,
            neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD)
        );

        const session = driver.session();
        
        try {
            // Clear all nodes and relationships
            await session.run('MATCH (n) DETACH DELETE n');
            console.log('Neo4j database cleared.');

            // Create the 4 starting nodes
            const startingItems = JSON.parse(resetRecipe);
            for (const item of startingItems) {
                await session.run(
                    'CREATE (n:Item {name: $name, emoji: $emoji})',
                    { name: item.product, emoji: item.emoji }
                );
            }
            
            console.log('Starting nodes created in Neo4j:', startingItems.map(item => item.product).join(', '));
            
        } catch (error) {
            console.error('Error resetting Neo4j:', error.message);
        } finally {
            await session.close();
            await driver.close();
        }
    } else {
        console.log('Neo4j not configured - skipping graph database reset.');
    }

    // Log reset reason if provided
    if (process.argv.length > 2) {
        fs.appendFileSync(path.join(__dirname, 'main.log'), 'Reason: ' + process.argv.slice(2).join(' ') + '\n');
    }

    console.log('Reset completed!');
}

resetDatabase().catch(console.error);
