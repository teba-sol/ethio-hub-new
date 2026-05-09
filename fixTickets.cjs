const fs = require('fs');
let content = fs.readFileSync('src/components/dashboard/Wizards.tsx', 'utf8');

content = content.replace(/t\.name_en === 'Standard' \|\| t\.name === 'Standard'/g, "t.name_en?.toLowerCase().includes('standard') || t.name?.toLowerCase().includes('standard')");
content = content.replace(/t\.name_en === 'VIP' \|\| t\.name === 'VIP'/g, "t.name_en?.toLowerCase().includes('vip') || t.name?.toLowerCase().includes('vip')");

fs.writeFileSync('src/components/dashboard/Wizards.tsx', content);
console.log('Done');
