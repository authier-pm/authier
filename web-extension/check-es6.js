// will fail if built js files are not valid ES5
// you'll be given line where the problem is and you can
// then `less +<line> <file>` to see what's causing it

const fs = require('fs')
const acorn = require('acorn')

// const globExpression = './dist/popup.js'
const jsFiles = ['./dist/js/popup.js']
console.log('~ jsFiles', jsFiles)

for (const f of jsFiles) {
  console.log(`file ${f}`)

  acorn.parse(fs.readFileSync(f, 'utf-8'), {
    ecmaVersion: 6,
    sourceFile: f
  })
}

console.log('✅ all files are parseable as ES5 JS')
