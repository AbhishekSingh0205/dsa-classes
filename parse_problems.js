const fs = require('fs');
const path = require('path');

const rawData = fs.readFileSync(path.join(__dirname, 'raw_problems.md'), 'utf-8');

const lines = rawData.split('\n');

const problemsUniq = new Map();

let currentTopic = '';

for (const line of lines) {
  if (line.startsWith('# 🔹 ')) {
    currentTopic = line.replace('# 🔹 ', '').split(' (')[0].trim();
  }
  
  if (line.startsWith('|') && !line.includes('Difficulty | Problem') && !line.includes('---|---|')) {
    const parts = line.split('|').map(p => p.trim());
    if (parts.length >= 4 && parts[1] && parts[2] && parts[3]) {
      const difficulty = parts[1];
      const title = parts[2];
      const link = parts[3];
      
      if (!problemsUniq.has(link)) {
        problemsUniq.set(link, {
          title,
          difficulty,
          topic: currentTopic,
          link
        });
      } else {
        // If it exists, append to topics if we want, or ignore. User said "deduplicate by link", 
        // let's add the topic if it's different.
        const existing = problemsUniq.get(link);
        if (!existing.topic.includes(currentTopic)) {
            existing.topic += `, ${currentTopic}`;
        }
      }
    }
  }
}

const problemsArray = Array.from(problemsUniq.values());

const tsOutput = `export interface ProblemData {
  title: string;
  difficulty: string;
  topic: string;
  link: string;
}

export const problems: ProblemData[] = ${JSON.stringify(problemsArray, null, 2)};
`;

fs.mkdirSync(path.join(__dirname, 'src', 'data'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'src', 'data', 'problems.ts'), tsOutput);

console.log(`Saved ${problemsArray.length} unique problems.`);
