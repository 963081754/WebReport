const func = require('./demo1.part')

func(12)

console.log("hello world")
console.log("this is a test")

process.stdin.setEncoding('utf8');

 

process.stdin.on('readable', () => {
  var chunk = process.stdin.read()
  if (chunk !== null) {
    process.stdout.write(`data: ${chunk}`)
  }
})
process.stdin.on('end', () => {
  process.stdout.write('end')
})