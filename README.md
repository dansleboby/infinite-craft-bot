![Infinite Craft BOT](botpic.png)

# Infinite Craft bot
This is a bot to play the game [Infinite Craft](https://neal.fun/infinite-craft/). The game starts with the four elements: Water, Fire, Wind, and Earth. You can then start combining elements to create items. For example, Earth and Water make a Plant. The game quickly starts creating many new items. For example, you can combine two Plants to create a Tree, then combine Tree and Fire to create Ash. 

My personal favorite item is Kim-Jong Boom.

## Usage
Make sure you have Node.js installed on your system. The project works on
Windows, macOS and Linux. After cloning the repository run:

```bash
npm install
```

Start the interactive menu with:

```bash
npm start
```

From the menu you can run the bot, reset the recipe files, configure settings or
generate a GraphViz file of the current recipes. The resulting graph data is
printed to the console and can be saved to a file:

```bash
npm run visualize > recipes.dot
```

You can then use `dot` from GraphViz to generate an image.

The recipe information is stored in `data/recipes.json`.

Settings such as the delay between API calls and how often data is saved are
kept in `config.json`. You can edit this file manually or through the
"Configure settings" option in the interactive menu.

### Optional Neo4j logging
If the environment variables `NEO4J_URI`, `NEO4J_USER` and `NEO4J_PASSWORD` are
set, each new recipe discovered by the bot is also written to the configured
Neo4j database. This allows for more advanced graph based visualisations.
