/** Groups agent list into { [category]: Agent[] } excluding "All". */
export function groupByCategory(agents, categories) {
  return categories.slice(1).reduce((acc, cat) => {
    const items = agents.filter((a) => a.category === cat);
    if (items.length) acc[cat] = items;
    return acc;
  }, {});
}
