# Visual Cypher Builder 🔨

> This is an experimental Neo4j Labs project and not part of Neo4j's supported product lineup. See the [Neo4j Labs disclaimer](./LABS_DISCLAIMER.txt).
The **Visual Cypher Builder** is a user-friendly tool that simplifies the process of building graph queries in Neo4j's Cypher language. With an intuitive drag-and-drop interface, it helps users — from beginners to experts — visually construct Cypher queries.  

Whether you're just starting with graph databases or looking for a faster way to build complex queries, this tool bridges the gap between abstract syntax and intuitive design.

You can try the prototype in your browser: 
👉 [Demo Environment](https://nielsdejong.nl/cypher-builder)

## Main Features
#### Build Queries Visually
- Drag-and-drop blocks to create query components such as nodes, relationships, and clauses.
- Rearrange and edit blocks to customize your query.  

#### Smart Wizard Suggestions
- Schema-aware guidance helps you select the next logical block.  
- Offers context-sensitive suggestions to streamline query construction.

#### Templates for Learning
- Explore pre-built queries to understand common Cypher patterns.  
- Generate examples dynamically based on your graph schema.

#### Schema-Aware Design
- Auto-generate nodes, relationships, and properties based on your database schema.  
- Real-time sampling to provide accurate suggestions.  


## Getting Started
Follow these steps to run the project locally:  

1. Clone the repository and navigate to the project folder:
   ```bash
   git clone https://github.com/neo4j-labs/visual-cypher-builder
   cd visual-cypher-builder
   ```

2. Install dependencies:
   ```bash
   yarn install
   ```

3. Start the development server:
   ```bash
   yarn run dev
   ```

4. Open your browser and navigate to:
   [http://localhost:5173/](http://localhost:5173/)



## Documentation
Check out the blog post:  
👉 [Visual Cypher Builder - Querying Neo4j for Everyone](https://medium.com/p/85cdbcd6dbb1/)


## Feedback & Contributions  
We’re eager to hear from you:

- Join the community forums: [Neo4j Community](https://community.neo4j.com)  
- Open an issue or submit a pull request on GitHub.  

**Note:** This project is part of Neo4j Labs, an incubator for experimental tools. While not officially supported, feedback and suggestions are welcome.


## Future Ideas 
Ideas for future versions include:  
- Advanced patterns with quantified path expressions.  
- Live validation and syntax correction.  
- Integrated query runner for visualizing results.  


## License  
This project is licensed under the [Apache 2.0](LICENSE) License.  

