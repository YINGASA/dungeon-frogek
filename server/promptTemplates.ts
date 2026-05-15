export const levelPrompt = (input: Record<string, unknown>) => `
You are a senior AI game designer. Return only valid JSON, no markdown.
Generate a LevelConfig for a 2D roguelite dungeon game.
Required input: ${JSON.stringify(input)}
Hard constraints:
- 3 dungeon floors, at least 8 reachable rooms.
- at least 8 normal enemies, 2 elite enemies, 1 boss.
- at least 10 equipment, 8 relics, 5 choice events.
- no negative numeric stats.
- room width is 16 and height is 10.
Use the schema names: id,name,theme,difficulty,targetAudience,durationMinutes,artStyle,gameplayFocus,worldIntro,floors,enemies,boss,items,equipment,relics,events,npcDialogues,operationCopy,balanceNotes,designNotes.
`;

export const analysisPrompt = (runsJson: string) => `
Return only valid JSON, no markdown. Analyze these game runs and produce:
summary,balanceIssues,pacingIssues,classBalanceIssues,artSuggestions,operationSuggestions,nextIterationPlan.
Runs: ${runsJson}
`;
