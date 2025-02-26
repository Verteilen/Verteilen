import express from 'express'

const app = express()

app.use(express.static('public'))

app.get('/express', (req, res) => {
    res.send('1')
})

app.listen(80, () => {
    console.log('server run at 80')
})