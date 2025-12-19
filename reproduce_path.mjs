
import parse from 'json-to-ast';

function isSafeIdentifier(key) {
    return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key);
}

function escapeString(str) {
    return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function generatePath(path) {
    if (path.length === 0) return '$';

    let result = '$';
    for (const segment of path) {
        if (typeof segment === 'number') {
            result += `[${segment}]`;
        } else if (isSafeIdentifier(segment)) {
            result += `.${segment}`;
        } else {
            result += `["${escapeString(segment)}"]`;
        }
    }
    return result;
}

function traverse(node, currentPath, positionMap) {
    if (!node || typeof node !== 'object') return;

    const n = node;
    const path = generatePath(currentPath);

    if (n.loc) {
        const valueRange = {
            start: { line: n.loc.start.line, column: n.loc.start.column },
            end: { line: n.loc.end.line, column: n.loc.end.column },
        };
        positionMap.set(path, { path, valueRange });
    }

    switch (n.type) {
        case 'Object':
            if (n.children) {
                for (const child of n.children) {
                    traverse(child, currentPath, positionMap);
                }
            }
            break;
        case 'Array':
            if (n.children) {
                n.children.forEach((child, index) => {
                    traverse(child, [...currentPath, index], positionMap);
                });
            }
            break;
        case 'Property':
            // Simplified property handling matching the updated logic
            if (n.key && typeof n.key === 'object') {
                const keyNode = n.key;
                if (typeof keyNode.value === 'string') {
                    traverse(n.value, [...currentPath, keyNode.value], positionMap);
                }
            }
            break;
    }
}

const json = `{
  "name": "示例",
  "enabled": true,
  "count": 3,
  "items": [
    "a",
    "b",
    "c"
  ],
  "meta": {
    "owner": "you",
    "tags": [
      "json",
      "graph"
    ]
  }
}`;

try {
    const ast = parse(json, { loc: true });
    const positionMap = new Map();
    traverse(ast, [], positionMap);

    console.log('Checking keys...');
    const keys = Array.from(positionMap.keys());

    // Check for "graph" path which should be $.meta.tags[1]
    const target = '$.meta.tags[1]';
    if (positionMap.has(target)) {
        console.log(`FOUND: ${target}`);
        console.log(JSON.stringify(positionMap.get(target), null, 2));
    } else {
        console.log(`MISSING: ${target}`);
        console.log('Available keys matching "graph":', keys.filter(k => k.includes('graph') || k.includes('tags')));
    }

    // Check boolean
    const boolTarget = '$.enabled';
    if (positionMap.has(boolTarget)) {
        console.log(`FOUND: ${boolTarget}`);
    } else {
        console.log(`MISSING: ${boolTarget}`);
    }

} catch (e) {
    console.error(e);
}
