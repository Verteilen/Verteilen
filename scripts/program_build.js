const pkg = require('pkg')

pkg.exec(["-t", "node16-x64", "-o", "./build/program/test.exe", "./src/program/test.ts"])